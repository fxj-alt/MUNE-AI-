import type { GarmentAnalysis, GeneratedLookPlan } from "./wardrobe-ai";

export type LookImageSuccess = {
  ok: true;
  image: {
    lookId: string;
    src: string;
    mimeType: string;
    model: string;
  };
};

export type LookImageErrorStage =
  | "upload"
  | "configuration"
  | "image-generation";

export type LookImageError = {
  ok: false;
  error: {
    stage: LookImageErrorStage;
    message: string;
    retryable: boolean;
    model?: string;
    apiStatus?: number;
    openAiType?: string;
    openAiCode?: string;
  };
};

export type GenerateLookImageResponse = LookImageSuccess | LookImageError;

function cleanList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join("; ");
}

export function buildLookImagePrompt({
  look,
  garment,
  weatherSummary,
  scene,
}: {
  look: GeneratedLookPlan;
  garment: GarmentAnalysis;
  weatherSummary: string;
  scene: string;
}) {
  return [
    "Create one realistic full-body fashion product image for MUNE, a desktop web AI wardrobe demo.",
    "Reference image 1 is the fixed system model: use it for the model's general pose, body proportions, framing, studio lighting, and calm editorial mood.",
    "Reference image 2 is the user's uploaded upper-body garment: use it specifically as the top in the final outfit. Preserve its visible color, pattern, neckline, sleeve length, fabric weight, and silhouette as closely as possible. Do not replace it with a generic white shirt unless the uploaded garment is actually white.",
    "Generate a complete Look on the model, not a flat lay and not a shopping product collage.",
    `Scene: ${scene}.`,
    `Weather context: ${weatherSummary}.`,
    `Detected garment: ${garment.color} ${garment.category}, fit: ${garment.fit}, material estimate: ${garment.material}.`,
    `Look title: ${look.title}.`,
    `Bottoms: ${look.bottoms}. Shoes: ${look.shoes}. Outerwear: ${look.outerwear}. Accessories: ${look.accessories}.`,
    `Styling steps: ${cleanList(look.stylingSteps)}.`,
    `Weather fit reason: ${look.weatherReason}.`,
    look.missingItems.length > 0
      ? `Missing items to infer visually if needed: ${cleanList(look.missingItems)}.`
      : "No required missing item is listed; keep the outfit practical and wardrobe-based.",
    "Visual style: clean premium East Asian fashion editorial, neutral indoor background, soft natural light, full body visible from head to shoes, clothing details clear, no text, no labels, no watermark, no UI.",
    "Keep the result suitable for a 3:4 recommendation card.",
  ].join("\n");
}

export function isGeneratedLookPlan(value: unknown): value is GeneratedLookPlan {
  if (!value || typeof value !== "object") return false;
  const look = value as Partial<GeneratedLookPlan>;
  return (
    typeof look.title === "string" &&
    typeof look.bottoms === "string" &&
    typeof look.shoes === "string" &&
    typeof look.outerwear === "string" &&
    typeof look.accessories === "string" &&
    typeof look.weatherReason === "string" &&
    Array.isArray(look.stylingSteps) &&
    look.stylingSteps.length === 3 &&
    look.stylingSteps.every((step) => typeof step === "string") &&
    Array.isArray(look.missingItems) &&
    look.missingItems.every((item) => typeof item === "string")
  );
}

export function isGarmentAnalysis(value: unknown): value is GarmentAnalysis {
  if (!value || typeof value !== "object") return false;
  const garment = value as Partial<GarmentAnalysis>;
  return (
    typeof garment.category === "string" &&
    typeof garment.color === "string" &&
    typeof garment.fit === "string" &&
    typeof garment.material === "string"
  );
}
