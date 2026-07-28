import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

import {
  buildLookImagePrompt,
  isGarmentAnalysis,
  isGeneratedLookPlan,
  type LookImageError,
  type GenerateLookImageResponse,
} from "../../../lib/look-image";

export const runtime = "nodejs";
export const maxDuration = 120;

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const acceptedImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const maxUploadSize = 10 * 1024 * 1024;
const defaultImageModel = "gpt-image-2";
const defaultImageQuality = "low";
const defaultImageSize = "1024x1536";
const modelReferencePath = join(
  process.cwd(),
  "public",
  "images",
  "profile-model-hd.png",
);

function jsonError(
  error: LookImageError["error"],
  status: number,
) {
  return NextResponse.json<GenerateLookImageResponse>({ ok: false, error }, {
    status,
  });
}

function safeJsonParse(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function extractOpenAiError(payload: unknown) {
  if (!payload || typeof payload !== "object") return {};
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return {};
  const value = error as {
    message?: unknown;
    type?: unknown;
    code?: unknown;
  };
  return {
    message: typeof value.message === "string" ? value.message : undefined,
    type: typeof value.type === "string" ? value.type : undefined,
    code: typeof value.code === "string" ? value.code : undefined,
  };
}

async function readModelReference() {
  const bytes = await readFile(modelReferencePath);
  return new Blob([bytes], { type: "image/png" });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(
      {
        stage: "upload",
        message: "无法读取生图请求，请重新上传衣服。",
        retryable: true,
      },
      400,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL || defaultImageModel;
  const quality = process.env.OPENAI_IMAGE_QUALITY || defaultImageQuality;
  const size = process.env.OPENAI_IMAGE_SIZE || defaultImageSize;
  const lookId = String(formData.get("lookId") ?? "").trim();
  const scene = String(formData.get("scene") ?? "").trim();
  const weatherSummary = String(formData.get("weatherSummary") ?? "").trim();
  const image = formData.get("image");
  const look = safeJsonParse(formData.get("look"));
  const garment = safeJsonParse(formData.get("garment"));

  if (!apiKey) {
    console.error("[MUNE image] configuration failed", {
      model,
      lookId,
      keyConfigured: false,
    });
    return jsonError(
      {
        stage: "configuration",
        message: "AI 生图服务尚未配置 OPENAI_API_KEY。",
        retryable: false,
        model,
      },
      503,
    );
  }

  if (!(image instanceof File) || image.size === 0) {
    return jsonError(
      {
        stage: "upload",
        message: "缺少用户上传的衣服图片。",
        retryable: true,
        model,
      },
      400,
    );
  }

  const extension = image.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    !acceptedImageTypes.has(image.type) ||
    !acceptedImageExtensions.has(extension)
  ) {
    return jsonError(
      {
        stage: "upload",
        message: "生图仅支持 JPG、PNG 或 WebP 衣服图片。",
        retryable: true,
        model,
      },
      415,
    );
  }

  if (image.size > maxUploadSize) {
    return jsonError(
      {
        stage: "upload",
        message: "衣服图片超过 10MB，请重新选择更小的图片。",
        retryable: true,
        model,
      },
      413,
    );
  }

  if (!lookId || !isGeneratedLookPlan(look) || !isGarmentAnalysis(garment)) {
    return jsonError(
      {
        stage: "upload",
        message: "缺少结构化 Look 数据，无法生成推荐图片。",
        retryable: true,
        model,
      },
      400,
    );
  }

  const prompt = buildLookImagePrompt({
    look,
    garment,
    weatherSummary,
    scene,
  });

  console.info("[MUNE image] request start", {
    model,
    lookId,
    quality,
    size,
    keyConfigured: true,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110_000);
  request.signal.addEventListener("abort", () => controller.abort(), {
    once: true,
  });

  try {
    const modelReference = await readModelReference();
    const openAiForm = new FormData();
    openAiForm.append("model", model);
    openAiForm.append("prompt", prompt);
    openAiForm.append("size", size);
    openAiForm.append("quality", quality);
    openAiForm.append("output_format", "webp");
    openAiForm.append("image[]", modelReference, "mune-system-model.png");
    openAiForm.append("image[]", image, image.name || "uploaded-garment.png");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openAiForm,
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const openAiError = extractOpenAiError(payload);
      console.error("[MUNE image] request failed", {
        model,
        lookId,
        status: response.status,
        type: openAiError.type,
        code: openAiError.code,
        message: openAiError.message?.slice(0, 500),
      });
      return jsonError(
        {
          stage: "image-generation",
          message:
            openAiError.message ??
            `OpenAI 图片生成失败，状态码 ${response.status}。`,
          retryable: response.status >= 429 || response.status >= 500,
          model,
          apiStatus: response.status,
          openAiType: openAiError.type,
          openAiCode: openAiError.code,
        },
        502,
      );
    }

    const b64Json =
      payload &&
      typeof payload === "object" &&
      Array.isArray((payload as { data?: unknown }).data)
        ? ((payload as { data: Array<{ b64_json?: unknown }> }).data[0]
            ?.b64_json ?? null)
        : null;

    if (typeof b64Json !== "string" || b64Json.length === 0) {
      console.error("[MUNE image] empty image output", { model, lookId });
      return jsonError(
        {
          stage: "image-generation",
          message: "OpenAI 已返回响应，但没有生成可用图片。",
          retryable: true,
          model,
        },
        502,
      );
    }

    console.info("[MUNE image] request success", {
      model,
      lookId,
      mimeType: "image/webp",
      base64Length: b64Json.length,
    });

    return NextResponse.json<GenerateLookImageResponse>({
      ok: true,
      image: {
        lookId,
        src: `data:image/webp;base64,${b64Json}`,
        mimeType: "image/webp",
        model,
      },
    });
  } catch (error) {
    const aborted = controller.signal.aborted;
    console.error("[MUNE image] request error", {
      model,
      lookId,
      aborted,
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonError(
      {
        stage: "image-generation",
        message: aborted
          ? "图片生成超时，请重新生成。"
          : "图片生成请求失败，请稍后重试。",
        retryable: true,
        model,
      },
      aborted ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
