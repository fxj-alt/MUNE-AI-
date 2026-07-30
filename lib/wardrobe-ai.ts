export const scenes = ["通勤", "日常", "约会"] as const;

export type Scene = (typeof scenes)[number];

export type GarmentAnalysis = {
  category: string;
  color: string;
  fit: string;
  material: string;
};

export type GeneratedLookPlan = {
  title: string;
  bottoms: string;
  shoes: string;
  outerwear: string;
  accessories: string;
  stylingSteps: string[];
  weatherReason: string;
  missingItems: string[];
};

export type WardrobeAiResult = {
  garment: GarmentAnalysis;
  weatherSummary: string;
  looks: GeneratedLookPlan[];
};

export type WeatherContext = {
  location: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  apparentTemperatureC: number;
  condition: string;
  weatherCode: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKph: number;
  minTemperatureC: number;
  maxTemperatureC: number;
};

export type GenerateLooksErrorStage =
  | "upload"
  | "weather"
  | "configuration"
  | "generation";

export type GenerateLooksResponse =
  | {
      ok: true;
      result: WardrobeAiResult;
      weather: WeatherContext;
      model: string;
    }
  | {
      ok: false;
      error: {
        stage: GenerateLooksErrorStage;
        message: string;
        retryable: boolean;
      };
    };

export const wardrobeAiJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["garment", "weatherSummary", "looks"],
  properties: {
    garment: {
      type: "object",
      additionalProperties: false,
      required: ["category", "color", "fit", "material"],
      properties: {
        category: { type: "string" },
        color: { type: "string" },
        fit: { type: "string" },
        material: { type: "string" },
      },
    },
    weatherSummary: { type: "string" },
    looks: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "bottoms",
          "shoes",
          "outerwear",
          "accessories",
          "stylingSteps",
          "weatherReason",
          "missingItems",
        ],
        properties: {
          title: { type: "string" },
          bottoms: { type: "string" },
          shoes: { type: "string" },
          outerwear: { type: "string" },
          accessories: { type: "string" },
          stylingSteps: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: { type: "string" },
          },
          weatherReason: { type: "string" },
          missingItems: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  },
} as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isWardrobeAiResult(value: unknown): value is WardrobeAiResult {
  if (!value || typeof value !== "object") return false;

  const result = value as Partial<WardrobeAiResult>;
  const garment = result.garment;
  if (
    !garment ||
    !isNonEmptyString(garment.category) ||
    !isNonEmptyString(garment.color) ||
    !isNonEmptyString(garment.fit) ||
    !isNonEmptyString(garment.material) ||
    !isNonEmptyString(result.weatherSummary)
  ) {
    return false;
  }

  return (
    Array.isArray(result.looks) &&
    result.looks.length === 3 &&
    result.looks.every(
      (look) =>
        look &&
        isNonEmptyString(look.title) &&
        isNonEmptyString(look.bottoms) &&
        isNonEmptyString(look.shoes) &&
        isNonEmptyString(look.outerwear) &&
        isNonEmptyString(look.accessories) &&
        Array.isArray(look.stylingSteps) &&
        look.stylingSteps.length === 3 &&
        look.stylingSteps.every(isNonEmptyString) &&
        isNonEmptyString(look.weatherReason) &&
        Array.isArray(look.missingItems) &&
        look.missingItems.every(isNonEmptyString),
    )
  );
}
