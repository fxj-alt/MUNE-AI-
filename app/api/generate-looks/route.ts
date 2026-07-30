import { NextResponse } from "next/server";

import {
  isWardrobeAiResult,
  scenes,
  wardrobeAiJsonSchema,
  type GenerateLooksResponse,
  type Scene,
  type WardrobeAiResult,
  type WeatherContext,
} from "../../../lib/wardrobe-ai";
import { getCurrentWeather } from "../../../lib/weather";

export const runtime = "nodejs";
export const maxDuration = 60;

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const acceptedImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const maxUploadSize = 10 * 1024 * 1024;
const defaultModel = "gpt-5.6-terra";
const demoModeEnabled = process.env.MUNE_AI_MOCK !== "false";

function errorResponse(
  stage: "upload" | "weather" | "configuration" | "generation",
  message: string,
  status: number,
  retryable = true,
) {
  const body: GenerateLooksResponse = {
    ok: false,
    error: { stage, message, retryable },
  };
  return NextResponse.json(body, { status });
}

function isValidCoordinate(value: number, minimum: number, maximum: number) {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function parseCoordinate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildWeatherPrompt(weather: WeatherContext) {
  return [
    `地点：${weather.location}`,
    `当前天气：${weather.condition}`,
    `温度：${weather.temperatureC}°C，体感 ${weather.apparentTemperatureC}°C`,
    `今日范围：${weather.minTemperatureC}°C 至 ${weather.maxTemperatureC}°C`,
    `降水：${weather.precipitationMm} mm，最高降水概率 ${weather.precipitationProbability}%`,
    `风速：${weather.windSpeedKph} km/h`,
  ].join("\n");
}

function buildFallbackWeather(city: string): WeatherContext {
  return {
    location: city.trim() || "当前位置",
    latitude: 31.2304,
    longitude: 121.4737,
    temperatureC: 26,
    apparentTemperatureC: 27,
    condition: "多云",
    weatherCode: 3,
    precipitationMm: 0,
    precipitationProbability: 20,
    windSpeedKph: 8,
    minTemperatureC: 23,
    maxTemperatureC: 29,
  };
}

function buildMockResult(
  scene: Scene,
  weather: WeatherContext,
): WardrobeAiResult {
  const weatherSummary = `${weather.location}当前${weather.condition}，${Math.round(weather.temperatureC)}°C，今日 ${Math.round(weather.minTemperatureC)}–${Math.round(weather.maxTemperatureC)}°C。`;
  const titles =
    scene === "通勤"
      ? ["简约通勤", "利落层次", "轻松会议"]
      : scene === "约会"
        ? ["柔和约会", "轻盈层次", "晚间松弛"]
        : ["轻松日常", "城市漫步", "周末层次"];

  return {
    garment: {
      category: "上衣",
      color: "本次上传",
      fit: "基础款",
      material: "Demo 中不做精确材质识别",
    },
    weatherSummary,
    looks: titles.map((title, index) => ({
      title,
      bottoms: "黑色西裤",
      shoes: "乐福鞋",
      outerwear:
        weather.temperatureC < 20 ? "轻薄西装外套" : "无需额外外套",
      accessories: index === 1 ? "窄腰带与托特包" : "结构感单肩包",
      stylingSteps:
        index === 0
          ? ["前侧衣摆轻塞入裤腰", "袖口卷至小臂中段", "整理后摆自然垂落"]
          : index === 1
            ? ["衬衫完整塞入高腰裤", "解开最上方一粒扣", "用窄腰带明确腰线"]
            : ["衣摆自然垂落", "袖口向上卷一圈", "用包袋建立纵向线条"],
      weatherReason: `适合${weather.condition}、约 ${Math.round(weather.temperatureC)}°C 的${scene}场景，可按体感增减外套。`,
      missingItems: [],
    })),
  };
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{ type?: unknown; text?: unknown }>;
    }>;
  };
  if (typeof response.output_text === "string") return response.output_text;

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

async function generateWithOpenAi({
  image,
  scene,
  preferences,
  weather,
  signal,
}: {
  image: File;
  scene: Scene;
  preferences: string;
  weather: WeatherContext;
  signal: AbortSignal;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const model = process.env.OPENAI_VISION_MODEL || defaultModel;
  const imageBytes = Buffer.from(await image.arrayBuffer());
  const imageDataUrl = `data:${image.type};base64,${imageBytes.toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content:
            "你是 MUNE 的穿搭规划模型。产品目标是最大化用户已有衣橱价值，不推荐购买新衣。先识别图片中的上衣，再结合天气、场景与偏好生成三套能直接照着穿的完整 Look。三套方案要体现同一件衣服的不同穿法。material 必须明确写为材质推测。缺少单品只列真正无法由常见衣橱替代的项目，没有则返回空数组。",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `场景：${scene}`,
                `用户偏好：${preferences || "简洁、实穿、优先复用已有衣物"}`,
                buildWeatherPrompt(weather),
                "请严格返回指定 JSON，不要添加解释文字。",
              ].join("\n\n"),
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "auto",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "mune_wardrobe_looks",
          strict: true,
          schema: wardrobeAiJsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("OpenAI response error", response.status, body.slice(0, 800));
    throw new Error(`OPENAI_REQUEST_FAILED_${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("OPENAI_EMPTY_OUTPUT");

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("OPENAI_INVALID_JSON");
  }
  if (!isWardrobeAiResult(parsed)) {
    throw new Error("OPENAI_SCHEMA_MISMATCH");
  }

  return { result: parsed, model };
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("upload", "无法读取上传内容，请重新选择图片。", 400);
  }

  const image = formData.get("image");
  const city = String(formData.get("city") ?? "");
  const sceneValue = String(formData.get("scene") ?? "");
  const preferences = String(formData.get("preferences") ?? "").slice(0, 1000);
  const latitude = parseCoordinate(formData.get("latitude"));
  const longitude = parseCoordinate(formData.get("longitude"));

  if (!(image instanceof File) || image.size === 0) {
    return errorResponse("upload", "请选择一张衣服图片。", 400);
  }
  const extension = image.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    !acceptedImageTypes.has(image.type) ||
    !acceptedImageExtensions.has(extension)
  ) {
    return errorResponse("upload", "仅支持 JPG、PNG 或 WebP 图片。", 415);
  }
  if (image.size > maxUploadSize) {
    return errorResponse("upload", "请选择小于 10MB 的图片。", 413);
  }
  if (!scenes.includes(sceneValue as Scene)) {
    return errorResponse("upload", "请选择通勤、日常或约会场景。", 400);
  }

  const hasCoordinates =
    latitude !== null &&
    longitude !== null &&
    isValidCoordinate(latitude, -90, 90) &&
    isValidCoordinate(longitude, -180, 180);
  if (!city.trim() && !hasCoordinates) {
    return errorResponse("weather", "请输入城市或允许获取当前位置。", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  request.signal.addEventListener("abort", () => controller.abort(), {
    once: true,
  });

  try {
    let weather: WeatherContext;
    try {
      weather = await getCurrentWeather({
        city,
        latitude: hasCoordinates ? latitude : null,
        longitude: hasCoordinates ? longitude : null,
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) throw error;
      console.warn("Weather lookup failed; using demo fallback weather", {
        message: error instanceof Error ? error.message : String(error),
      });
      weather = buildFallbackWeather(city);
    }

    if (demoModeEnabled) {
      const result = buildMockResult(sceneValue as Scene, weather);
      const body: GenerateLooksResponse = {
        ok: true,
        result,
        weather,
        model: "mune-demo-mock",
      };
      return NextResponse.json(body);
    }

    try {
      const generated = await generateWithOpenAi({
        image,
        scene: sceneValue as Scene,
        preferences,
        weather,
        signal: controller.signal,
      });
      const body: GenerateLooksResponse = {
        ok: true,
        result: generated.result,
        weather,
        model: generated.model,
      };
      return NextResponse.json(body);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "OPENAI_API_KEY_MISSING"
      ) {
        return errorResponse(
          "configuration",
          "AI 服务尚未配置，请添加服务端 API Key 后重试。",
          503,
          false,
        );
      }
      if (controller.signal.aborted) {
        return errorResponse("generation", "生成请求超时，请重新生成。", 504);
      }
      console.error("Look generation failed", error);
      return errorResponse(
        "generation",
        "这次没有生成完成，你上传的衣服仍然保留。",
        502,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}
