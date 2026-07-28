"use client";

/* eslint-disable @next/next/no-img-element */

import type {
  CSSProperties,
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  RefObject,
  SyntheticEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  scenes,
  type GenerateLooksResponse,
  type GeneratedLookPlan,
  type GarmentAnalysis,
  type Scene,
  type WardrobeAiResult,
  type WeatherContext,
} from "../lib/wardrobe-ai";
import type { GenerateLookImageResponse } from "../lib/look-image";

type View =
  | "login"
  | "discover"
  | "recommend"
  | "detail"
  | "tryon"
  | "wardrobe"
  | "profile";

type DetailTab = "outfit" | "tutorial";
type WardrobeTab = "looks" | "items";
type UploadErrorStage =
  | "validation"
  | "image-read"
  | "analysis"
  | "weather"
  | "configuration"
  | "generation";

type UploadFlowState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "preview" }
  | { status: "analyzing" }
  | { status: "generating" }
  | { status: "success" }
  | {
      status: "error";
      stage: UploadErrorStage;
      title: string;
      message: string;
    };

type LookImageFlowState =
  | { status: "idle" }
  | { status: "generating"; lookId: string }
  | { status: "success"; lookId: string; model: string }
  | { status: "error"; lookId: string; message: string };

type ProfileState =
  | { status: "profileIdle" }
  | { status: "profileSaving" }
  | { status: "profileSaved" }
  | { status: "profileError"; message: string };

type TryOnState =
  | { status: "tryonSuccess" }
  | { status: "tryonRegenerating" }
  | { status: "tryonError"; message: string };

type LocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type GarmentContext = {
  id: string;
  name: string;
  previewUrl: string;
  source: "upload" | "official" | "wardrobe";
  ownsPreviewUrl: boolean;
  file: File | null;
};

type LookOutfitItem = {
  id: string;
  name: string;
  image: string;
  method: string;
};

type TutorialStep = {
  id: string;
  title: string;
  body: string;
  image: string;
};

type Look = {
  id: string;
  name: string;
  scene: string;
  weather: string;
  image: string;
  detailImage: string;
  tryOnImage: string;
  note: string;
  outfitItems: LookOutfitItem[];
  tutorialSteps: TutorialStep[];
  aiPlan?: GeneratedLookPlan;
  garmentAnalysis?: GarmentAnalysis;
  weatherSummary?: string;
};

type WardrobeItem = LookOutfitItem & {
  type: string;
  recommendationLookId: string;
};

const commuteOutfitItems: LookOutfitItem[] = [
  {
    id: "commute-shirt",
    name: "白衬衫",
    image: "/images/item-shirt.jpg",
    method: "半塞",
  },
  {
    id: "commute-pants",
    name: "黑色西裤",
    image: "/images/item-pants.jpg",
    method: "常规",
  },
  {
    id: "commute-shoes",
    name: "乐福鞋",
    image: "/images/item-shoes-beige.jpg",
    method: "正常穿着",
  },
  {
    id: "commute-bag",
    name: "托特包",
    image: "/images/item-bag.jpg",
    method: "单肩",
  },
];

const urbanOutfitItems: LookOutfitItem[] = [
  {
    id: "urban-shirt",
    name: "白衬衫",
    image: "/images/item-shirt.jpg",
    method: "卷袖",
  },
  {
    id: "urban-pants",
    name: "黑色西裤",
    image: "/images/item-pants.jpg",
    method: "高腰",
  },
  {
    id: "urban-shoes",
    name: "黑色短靴",
    image: "/images/item-boots.jpg",
    method: "正常穿着",
  },
  {
    id: "urban-bag",
    name: "托特包",
    image: "/images/item-bag.jpg",
    method: "手提",
  },
];

const dailyOutfitItems: LookOutfitItem[] = [
  {
    id: "daily-shirt",
    name: "白衬衫",
    image: "/images/item-shirt.jpg",
    method: "自然系腰",
  },
  {
    id: "daily-pants",
    name: "白色长裤",
    image: "/images/item-pants.jpg",
    method: "高腰",
  },
  {
    id: "daily-shoes",
    name: "小白鞋",
    image: "/images/item-sneakers.jpg",
    method: "正常穿着",
  },
  {
    id: "daily-bag",
    name: "日常托特包",
    image: "/images/item-bag.jpg",
    method: "手提",
  },
];

const halfTuckTutorial: TutorialStep[] = [
  {
    id: "half-tuck-front",
    title: "将衬衫前摆塞入裤腰",
    body: "前侧衣摆轻塞，先确定腰线位置。",
    image: "/images/wear-step-1-composed.jpg",
  },
  {
    id: "half-tuck-back",
    title: "后摆自然垂落",
    body: "后侧衣摆放松，避免整体过紧。",
    image: "/images/wear-step-2-composed.jpg",
  },
  {
    id: "half-tuck-sleeve",
    title: "袖口卷起一圈",
    body: "露出手腕，增加上半身层次。",
    image: "/images/wear-step-3-composed.jpg",
  },
];

const rolledSleeveTutorial: TutorialStep[] = [
  {
    id: "rolled-sleeve-cuff",
    title: "解开袖口",
    body: "先将袖口展开，保留自然松量。",
    image: "/images/wear-step-2-composed.jpg",
  },
  {
    id: "rolled-sleeve-fold",
    title: "向上卷起一圈",
    body: "卷至小臂位置，让比例更轻盈。",
    image: "/images/wear-step-3-composed.jpg",
  },
  {
    id: "rolled-sleeve-tuck",
    title: "整理前侧衣摆",
    body: "轻塞前摆，保持上身利落。",
    image: "/images/wear-step-1-composed.jpg",
  },
];

const tiedShirtTutorial: TutorialStep[] = [
  {
    id: "tied-shirt-balance",
    title: "调整两侧衣摆",
    body: "让左右衣摆长度接近，方便打结。",
    image: "/images/wear-step-2-composed.jpg",
  },
  {
    id: "tied-shirt-knot",
    title: "在腰线处轻系",
    body: "保持结点松弛，不要收得过紧。",
    image: "/images/wear-step-1-composed.jpg",
  },
  {
    id: "tied-shirt-sleeve",
    title: "卷起袖口",
    body: "露出手腕，让整体更适合日常。",
    image: "/images/wear-step-3-composed.jpg",
  },
];

const looks: Look[] = [
  {
    id: "commute",
    name: "简约通勤 Look",
    scene: "通勤",
    weather: "26°C",
    image: "/images/look-commute-hd.png",
    detailImage: "/images/look-detail-hd.png",
    tryOnImage: "/images/try-on-hd.png",
    note: "用白衬衫半塞进西裤，保留利落比例，也适合今天的温度。",
    outfitItems: commuteOutfitItems,
    tutorialSteps: halfTuckTutorial,
  },
  {
    id: "urban",
    name: "城市极简 Look",
    scene: "城市极简",
    weather: "26°C",
    image: "/images/look-urban-hd.png",
    detailImage: "/images/look-detail-hd.png",
    tryOnImage: "/images/try-on-hd.png",
    note: "白衬衫配黑色阔腿裤，卷起袖口后更轻盈。",
    outfitItems: urbanOutfitItems,
    tutorialSteps: rolledSleeveTutorial,
  },
  {
    id: "daily",
    name: "轻松日常 Look",
    scene: "日常",
    weather: "26°C",
    image: "/images/look-daily-hd.png",
    detailImage: "/images/look-detail-hd.png",
    tryOnImage: "/images/try-on-hd.png",
    note: "白衬衫自然系腰，搭配浅色长裤，适合周末和轻办公。",
    outfitItems: dailyOutfitItems,
    tutorialSteps: tiedShirtTutorial,
  },
];

function isNoOuterwear(value: string) {
  return /^(无|无需|不需要|不搭配)/.test(value.trim());
}

function buildAiLooks({
  result,
  weather,
  garmentImage,
  scene,
  requestId,
}: {
  result: WardrobeAiResult;
  weather: WeatherContext;
  garmentImage: string;
  scene: Scene;
  requestId: number;
}): Look[] {
  const tutorialImages = [
    "/images/wear-step-1-composed.jpg",
    "/images/wear-step-2-composed.jpg",
    "/images/wear-step-3-composed.jpg",
  ];

  return result.looks.map((plan, index) => {
    const visual = looks[index] ?? looks[0];
    const finalItem = isNoOuterwear(plan.outerwear)
      ? { name: plan.accessories, method: "点缀", image: "/images/item-bag.jpg" }
      : { name: plan.outerwear, method: "外搭", image: "/images/item-blazer.jpg" };

    return {
      ...visual,
      id: `ai-${requestId}-${index + 1}`,
      name: plan.title,
      scene,
      weather: `${Math.round(weather.temperatureC)}°C`,
      note: plan.weatherReason,
      outfitItems: [
        {
          id: `ai-${requestId}-${index + 1}-garment`,
          name: `${result.garment.color}${result.garment.category}`,
          image: garmentImage,
          method: plan.stylingSteps[0],
        },
        {
          id: `ai-${requestId}-${index + 1}-bottoms`,
          name: plan.bottoms,
          image: "/images/item-pants.jpg",
          method: plan.stylingSteps[1],
        },
        {
          id: `ai-${requestId}-${index + 1}-shoes`,
          name: plan.shoes,
          image: "/images/item-shoes-beige.jpg",
          method: "正常穿着",
        },
        {
          id: `ai-${requestId}-${index + 1}-finishing`,
          ...finalItem,
        },
      ],
      tutorialSteps: plan.stylingSteps.map((step, stepIndex) => ({
        id: `ai-${requestId}-${index + 1}-step-${stepIndex + 1}`,
        title: step,
        body:
          stepIndex === 0
            ? "先确定上衣的穿法与腰线位置。"
            : stepIndex === 1
              ? "整理上下装比例，让轮廓保持利落。"
              : "最后调整袖口、外套或配饰细节。",
        image: tutorialImages[stepIndex],
      })),
      aiPlan: plan,
      garmentAnalysis: result.garment,
      weatherSummary: result.weatherSummary,
    };
  });
}

const wardrobeItems: WardrobeItem[] = [
  {
    id: "shirt",
    name: "白衬衫",
    image: "/images/item-shirt.jpg",
    method: "半塞",
    type: "上衣",
    recommendationLookId: "commute",
  },
  {
    id: "tee",
    name: "蓝色 T 恤",
    image: "/images/item-tee.jpg",
    method: "常规",
    type: "上衣",
    recommendationLookId: "daily",
  },
  {
    id: "blazer",
    name: "米色西装",
    image: "/images/item-blazer.jpg",
    method: "外搭",
    type: "外套",
    recommendationLookId: "urban",
  },
  {
    id: "coat",
    name: "风衣",
    image: "/images/item-coat.jpg",
    method: "敞开",
    type: "外套",
    recommendationLookId: "urban",
  },
  {
    id: "jeans",
    name: "牛仔裤",
    image: "/images/item-jeans.jpg",
    method: "九分",
    type: "裤装",
    recommendationLookId: "daily",
  },
  {
    id: "bag",
    name: "托特包",
    image: "/images/item-bag.jpg",
    method: "单肩",
    type: "包袋",
    recommendationLookId: "commute",
  },
  {
    id: "dress",
    name: "白色长裙",
    image: "/images/item-dress.jpg",
    method: "常规",
    type: "连衣裙",
    recommendationLookId: "daily",
  },
  {
    id: "pants",
    name: "白色长裤",
    image: "/images/item-pants.jpg",
    method: "高腰",
    type: "裤装",
    recommendationLookId: "daily",
  },
  {
    id: "blackdress",
    name: "黑色吊带裙",
    image: "/images/item-blackdress.jpg",
    method: "叠穿",
    type: "连衣裙",
    recommendationLookId: "urban",
  },
  {
    id: "shoes",
    name: "乐福鞋",
    image: "/images/item-shoes-beige.jpg",
    method: "正常穿着",
    type: "鞋履",
    recommendationLookId: "commute",
  },
  {
    id: "boots",
    name: "短靴",
    image: "/images/item-boots.jpg",
    method: "正常穿着",
    type: "鞋履",
    recommendationLookId: "urban",
  },
  {
    id: "sneakers",
    name: "小白鞋",
    image: "/images/item-sneakers.jpg",
    method: "正常穿着",
    type: "鞋履",
    recommendationLookId: "daily",
  },
  {
    id: "black-shirt",
    name: "黑色衬衫",
    image: "/images/item-blackdress.jpg",
    method: "叠穿",
    type: "上衣",
    recommendationLookId: "urban",
  },
  {
    id: "cream-pants",
    name: "奶油色西裤",
    image: "/images/item-pants.jpg",
    method: "高腰",
    type: "裤装",
    recommendationLookId: "commute",
  },
  {
    id: "black-coat",
    name: "黑色长外套",
    image: "/images/item-coat.jpg",
    method: "敞开",
    type: "外套",
    recommendationLookId: "urban",
  },
  {
    id: "weekend-dress",
    name: "周末长裙",
    image: "/images/item-dress.jpg",
    method: "常规",
    type: "连衣裙",
    recommendationLookId: "daily",
  },
  {
    id: "ankle-boots",
    name: "黑色短靴",
    image: "/images/item-boots.jpg",
    method: "正常穿着",
    type: "鞋履",
    recommendationLookId: "urban",
  },
  {
    id: "daily-tote",
    name: "日常托特包",
    image: "/images/item-bag.jpg",
    method: "手提",
    type: "包袋",
    recommendationLookId: "daily",
  },
  {
    id: "white-top",
    name: "白色无袖上衣",
    image: "/images/item-shirt.jpg",
    method: "外穿",
    type: "上衣",
    recommendationLookId: "daily",
  },
  {
    id: "light-jeans",
    name: "浅蓝牛仔裤",
    image: "/images/item-jeans.jpg",
    method: "九分",
    type: "裤装",
    recommendationLookId: "daily",
  },
  {
    id: "soft-blazer",
    name: "柔软西装外套",
    image: "/images/item-blazer.jpg",
    method: "外搭",
    type: "外套",
    recommendationLookId: "commute",
  },
  {
    id: "city-shoes",
    name: "通勤乐福鞋",
    image: "/images/item-shoes-beige.jpg",
    method: "正常穿着",
    type: "鞋履",
    recommendationLookId: "commute",
  },
  {
    id: "white-sneaker",
    name: "白色运动鞋",
    image: "/images/item-sneakers.jpg",
    method: "正常穿着",
    type: "鞋履",
    recommendationLookId: "daily",
  },
  {
    id: "blue-basic",
    name: "蓝色基础上衣",
    image: "/images/item-tee.jpg",
    method: "常规",
    type: "上衣",
    recommendationLookId: "daily",
  },
];

const wardrobeLookDemoSources = [
  { seedId: "commute", image: "/images/look-commute-hd.png" },
  { seedId: "urban", image: "/images/profile-model-hd.png" },
  { seedId: "daily", image: "/images/look-daily-hd.png" },
  { seedId: "commute", image: "/images/try-on-hd.png" },
  { seedId: "urban", image: "/images/look-urban-hd.png" },
  { seedId: "daily", image: "/images/login-model-hd.png" },
  { seedId: "commute", image: "/images/home-look-hd.png" },
  { seedId: "daily", image: "/images/look-detail-hd.png" },
  { seedId: "urban", image: "/images/look-urban-hd.png" },
  { seedId: "commute", image: "/images/profile-model-hd.png" },
  { seedId: "daily", image: "/images/look-daily-hd.png" },
  { seedId: "urban", image: "/images/try-on-hd.png" },
  { seedId: "commute", image: "/images/login-model-hd.png" },
  { seedId: "daily", image: "/images/home-look-hd.png" },
  { seedId: "urban", image: "/images/look-detail-hd.png" },
  { seedId: "commute", image: "/images/look-commute-hd.png" },
  { seedId: "daily", image: "/images/profile-model-hd.png" },
  { seedId: "urban", image: "/images/look-urban-hd.png" },
  { seedId: "commute", image: "/images/try-on-hd.png" },
  { seedId: "daily", image: "/images/login-model-hd.png" },
  { seedId: "urban", image: "/images/home-look-hd.png" },
  { seedId: "commute", image: "/images/look-detail-hd.png" },
  { seedId: "daily", image: "/images/look-daily-hd.png" },
  { seedId: "urban", image: "/images/profile-model-hd.png" },
  { seedId: "commute", image: "/images/look-commute-hd.png" },
  { seedId: "daily", image: "/images/try-on-hd.png" },
  { seedId: "urban", image: "/images/login-model-hd.png" },
  { seedId: "commute", image: "/images/home-look-hd.png" },
];

function createWardrobeDemoLook(
  seed: Look,
  image: string,
  index: number,
): Look {
  const id = `${seed.id}-copy-${index + 1}`;

  return {
    ...seed,
    id,
    image,
    detailImage: image,
    tryOnImage: image,
    outfitItems: seed.outfitItems.map((item) => ({
      ...item,
      id: `${id}-${item.id}`,
    })),
    tutorialSteps: seed.tutorialSteps.map((step) => ({
      ...step,
      id: `${id}-${step.id}`,
    })),
  };
}

const wardrobeDemoLooks = wardrobeLookDemoSources.map((entry, index) => {
  const seed = looks.find((look) => look.id === entry.seedId) ?? looks[0];
  return createWardrobeDemoLook(seed, entry.image, index);
});

const wardrobeLookFallbacks: Record<string, string> = {
  "/images/look-commute-hd.png": "/images/look-commute.jpg",
  "/images/look-urban-hd.png": "/images/look-urban.jpg",
  "/images/look-daily-hd.png": "/images/look-daily.jpg",
  "/images/try-on-hd.png": "/images/try-on.jpg",
  "/images/profile-model-hd.png": "/images/profile-model.jpg",
  "/images/login-model-hd.png": "/images/login-model.jpg",
  "/images/home-look-hd.png": "/images/home-look.jpg",
  "/images/look-detail-hd.png": "/images/look-detail.jpg",
};

function applyImageFallback(
  event: SyntheticEvent<HTMLImageElement>,
  fallback: string,
) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;

  image.dataset.fallbackApplied = "true";
  image.src = fallback;
}

const wardrobeHdImages: Record<string, string> = {
  "/images/item-shirt.jpg": "/images/wardrobe-item-shirt-display.png",
  "/images/item-tee.jpg": "/images/wardrobe-item-tee-display.png",
  "/images/item-blazer.jpg": "/images/wardrobe-item-blazer-display.png",
  "/images/item-coat.jpg": "/images/wardrobe-item-coat-display.png",
  "/images/item-jeans.jpg": "/images/wardrobe-item-jeans-display.png",
  "/images/item-bag.jpg": "/images/wardrobe-item-bag-display.png",
  "/images/item-dress.jpg": "/images/wardrobe-item-dress-display.png",
  "/images/item-pants.jpg": "/images/wardrobe-item-pants-display.png",
  "/images/item-blackdress.jpg": "/images/wardrobe-item-blackdress-display.png",
  "/images/item-shoes-beige.jpg": "/images/wardrobe-item-shoes-display.png",
  "/images/item-boots.jpg": "/images/wardrobe-item-boots-display.png",
  "/images/item-sneakers.jpg": "/images/wardrobe-item-sneakers-display.png",
};

const wardrobeGalleryOrder = [
  "shirt",
  "coat",
  "tee",
  "dress",
  "blazer",
  "jeans",
  "bag",
  "blackdress",
  "pants",
  "shoes",
  "weekend-dress",
  "boots",
  "white-top",
  "black-coat",
  "sneakers",
  "cream-pants",
  "soft-blazer",
  "daily-tote",
  "blue-basic",
  "light-jeans",
  "ankle-boots",
  "black-shirt",
  "white-sneaker",
  "city-shoes",
  "dress",
  "tee",
  "coat",
  "shirt",
  "jeans",
  "blackdress",
  "bag",
  "pants",
  "weekend-dress",
  "shoes",
  "light-jeans",
  "boots",
  "white-top",
  "soft-blazer",
  "black-coat",
  "sneakers",
  "cream-pants",
  "blue-basic",
  "daily-tote",
  "white-sneaker",
  "blazer",
  "ankle-boots",
  "city-shoes",
  "black-shirt",
  "coat",
  "shirt",
  "dress",
  "tee",
  "jeans",
  "shoes",
];

function createWardrobeGalleryItems(): WardrobeItem[] {
  const copyCounts = new Map<string, number>();

  return wardrobeGalleryOrder.map((sourceId) => {
    const source =
      wardrobeItems.find((item) => item.id === sourceId) ?? wardrobeItems[0];
    const copyCount = copyCounts.get(source.id) ?? 0;
    copyCounts.set(source.id, copyCount + 1);

    return {
      ...source,
      id:
        copyCount === 0
          ? source.id
          : `${source.id}-copy-${copyCount}`,
      image: wardrobeHdImages[source.image] ?? source.image,
    };
  });
}

const wardrobeGalleryItems = createWardrobeGalleryItems();

const profileBodyTypes = ["苹果型", "梨型", "沙漏型", "倒三角型", "直筒型", "匀称型"];

const profileBodyImages: Record<string, string> = {
  苹果型: "/images/ui-body-1-hd.png",
  梨型: "/images/ui-body-2-hd.png",
  沙漏型: "/images/ui-body-3-hd.png",
  倒三角型: "/images/ui-body-4-hd.png",
  直筒型: "/images/ui-body-5-hd.png",
  匀称型: "/images/ui-body-6-hd.png",
};

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const acceptedImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const maxUploadSize = 10 * 1024 * 1024;
const analysisTransitionDelay = 700;
const forceDemoAnalysisError = false;
const forceDemoGenerationError = false;
const profileSaveDelay = 650;
const profileSavedHoldDelay = 400;
const tryOnRegenerationDelay = 2200;
const forceDemoProfileSaveError = false;
const forceDemoTryOnError = false;

function isUploadBusy(flow: UploadFlowState) {
  return (
    flow.status === "validating" ||
    flow.status === "analyzing" ||
    flow.status === "generating"
  );
}

function getGarmentName(fileName: string) {
  const name = fileName.replace(/\.[^.]+$/, "").trim();
  const normalized = name.toLowerCase();
  const knownGarments: Array<[string, string]> = [
    ["shirt", "白衬衫"],
    ["衬衫", "白衬衫"],
    ["tee", "T 恤"],
    ["tshirt", "T 恤"],
    ["jeans", "牛仔裤"],
    ["pants", "西裤"],
    ["dress", "连衣裙"],
    ["coat", "外套"],
    ["blazer", "西装外套"],
  ];
  const match = knownGarments.find(([keyword]) => normalized.includes(keyword));

  if (match) return match[1];
  if (!name || name.length > 24 || /^(img|dsc)[-_]?\d+/i.test(name)) {
    return "已上传单品";
  }
  return name;
}

function readFileAsDataUrl(file: File, signal: AbortSignal) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => {
      reader.abort();
      reject(new DOMException("Operation aborted", "AbortError"));
    };

    signal.addEventListener("abort", abort, { once: true });
    reader.onload = () => {
      signal.removeEventListener("abort", abort);
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("IMAGE_READ_FAILED"));
    };
    reader.onerror = () => {
      signal.removeEventListener("abort", abort);
      reject(reader.error ?? new Error("IMAGE_READ_FAILED"));
    };
    reader.onabort = () => {
      signal.removeEventListener("abort", abort);
    };
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [view, setView] = useState<View>("login");
  const [isNewUser, setIsNewUser] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFlow, setUploadFlow] = useState<UploadFlowState>({ status: "idle" });
  const [currentGarment, setCurrentGarment] = useState<GarmentContext | null>(null);
  const [recommendationGarment, setRecommendationGarment] =
    useState<GarmentContext | null>(null);
  const [recommendedLooks, setRecommendedLooks] = useState<Look[]>(looks);
  const [hasGeneratedAiResults, setHasGeneratedAiResults] = useState(false);
  const [firstLookImageFlow, setFirstLookImageFlow] =
    useState<LookImageFlowState>({ status: "idle" });
  const [, setGenerationResult] = useState<WardrobeAiResult | null>(null);
  const [city, setCity] = useState("上海");
  const [scene, setScene] = useState<Scene>("通勤");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationState, setLocationState] = useState<LocationState>({
    status: "idle",
  });
  const [detailTab, setDetailTab] = useState<DetailTab>("outfit");
  const [wardrobeTab, setWardrobeTab] = useState<WardrobeTab>("looks");
  const [selectedLook, setSelectedLook] = useState<Look>(looks[0]);
  const [savedLookIds, setSavedLookIds] = useState<string[]>(["commute", "urban"]);
  const [toast, setToast] = useState("");
  const [prompt, setPrompt] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);
  const [profileReturn, setProfileReturn] = useState<View>("discover");
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileState, setProfileState] = useState<ProfileState>({
    status: "profileIdle",
  });
  const [tryOnState, setTryOnState] = useState<TryOnState>({
    status: "tryonSuccess",
  });
  const [profileVersion, setProfileVersion] = useState(0);
  const [renderedProfileVersion, setRenderedProfileVersion] = useState(0);
  const [bodyType, setBodyType] = useState("沙漏型");
  const [skinTone, setSkinTone] = useState("自然");
  const [favoriteLookIds, setFavoriteLookIds] = useState<string[]>([]);
  const [profileUploadOpen, setProfileUploadOpen] = useState(false);
  const [profileUploadPreview, setProfileUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const uploadFlowRef = useRef<UploadFlowState>({ status: "idle" });
  const currentGarmentRef = useRef<GarmentContext | null>(null);
  const uploadOperationIdRef = useRef(0);
  const uploadTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const pendingPreviewUrlRef = useRef<string | null>(null);
  const uploadModalRestoreFlowRef = useRef<UploadFlowState | null>(null);
  const uploadModalOpenedGarmentIdRef = useRef<string | null>(null);
  const demoAnalysisFailureConsumedRef = useRef(false);
  const demoGenerationFailureConsumedRef = useRef(false);
  const profileStateRef = useRef<ProfileState>({ status: "profileIdle" });
  const tryOnStateRef = useRef<TryOnState>({ status: "tryonSuccess" });
  const profileVersionRef = useRef(0);
  const renderedProfileVersionRef = useRef(0);
  const profileOperationIdRef = useRef(0);
  const tryOnOperationIdRef = useRef(0);
  const profileTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const tryOnTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const demoProfileSaveFailureConsumedRef = useRef(false);
  const demoTryOnFailureConsumedRef = useRef(false);

  function updateProfileState(nextState: ProfileState) {
    profileStateRef.current = nextState;
    setProfileState(nextState);
  }

  function updateTryOnState(nextState: TryOnState) {
    tryOnStateRef.current = nextState;
    setTryOnState(nextState);
  }

  function updateProfileVersion(nextVersion: number) {
    profileVersionRef.current = nextVersion;
    setProfileVersion(nextVersion);
  }

  function updateRenderedProfileVersion(nextVersion: number) {
    renderedProfileVersionRef.current = nextVersion;
    setRenderedProfileVersion(nextVersion);
  }

  function clearProfileTimers() {
    profileTimersRef.current.forEach((timer) => clearTimeout(timer));
    profileTimersRef.current.clear();
  }

  function clearTryOnTimers() {
    tryOnTimersRef.current.forEach((timer) => clearTimeout(timer));
    tryOnTimersRef.current.clear();
  }

  function invalidateProfileOperation() {
    profileOperationIdRef.current += 1;
    clearProfileTimers();
    return profileOperationIdRef.current;
  }

  function invalidateTryOnOperation() {
    tryOnOperationIdRef.current += 1;
    clearTryOnTimers();
    return tryOnOperationIdRef.current;
  }

  function scheduleProfileTask(
    operationId: number,
    callback: () => void,
    delay: number,
  ) {
    const timer = setTimeout(() => {
      profileTimersRef.current.delete(timer);
      if (profileOperationIdRef.current !== operationId) return;
      callback();
    }, delay);
    profileTimersRef.current.add(timer);
  }

  function scheduleTryOnTask(
    operationId: number,
    callback: () => void,
    delay: number,
  ) {
    const timer = setTimeout(() => {
      tryOnTimersRef.current.delete(timer);
      if (tryOnOperationIdRef.current !== operationId) return;
      callback();
    }, delay);
    tryOnTimersRef.current.add(timer);
  }

  function shouldFailProfileSave() {
    if (process.env.NODE_ENV !== "development") return false;
    const query = new URLSearchParams(window.location.search);
    const enabled =
      forceDemoProfileSaveError || query.get("demoProfileSaveError") === "1";
    if (!enabled || demoProfileSaveFailureConsumedRef.current) return false;
    demoProfileSaveFailureConsumedRef.current = true;
    return true;
  }

  function shouldFailTryOnRegeneration() {
    if (process.env.NODE_ENV !== "development") return false;
    const query = new URLSearchParams(window.location.search);
    const enabled =
      forceDemoTryOnError || query.get("demoTryonError") === "1";
    if (!enabled || demoTryOnFailureConsumedRef.current) return false;
    demoTryOnFailureConsumedRef.current = true;
    return true;
  }

  function updateUploadFlow(nextFlow: UploadFlowState) {
    uploadFlowRef.current = nextFlow;
    setUploadFlow(nextFlow);
  }

  function updateCurrentGarment(nextGarment: GarmentContext | null) {
    currentGarmentRef.current = nextGarment;
    setCurrentGarment(nextGarment);
  }

  function clearUploadTimers() {
    uploadTimersRef.current.forEach((timer) => clearTimeout(timer));
    uploadTimersRef.current.clear();
  }

  function revokePendingPreview() {
    if (!pendingPreviewUrlRef.current) return;
    URL.revokeObjectURL(pendingPreviewUrlRef.current);
    pendingPreviewUrlRef.current = null;
  }

  function invalidateUploadOperation() {
    uploadOperationIdRef.current += 1;
    uploadAbortControllerRef.current?.abort();
    uploadAbortControllerRef.current = null;
    clearUploadTimers();
    revokePendingPreview();
    return uploadOperationIdRef.current;
  }

  function scheduleUploadTask(
    operationId: number,
    callback: () => void,
    delay: number,
  ) {
    const timer = setTimeout(() => {
      uploadTimersRef.current.delete(timer);
      if (uploadOperationIdRef.current !== operationId) return;
      callback();
    }, delay);

    uploadTimersRef.current.add(timer);
  }

  function shouldFailDemoStage(stage: "analysis" | "generation") {
    if (process.env.NODE_ENV !== "development") return false;

    const query = new URLSearchParams(window.location.search);
    if (stage === "analysis") {
      const enabled =
        forceDemoAnalysisError || query.get("demoAnalysisError") === "1";
      if (!enabled || demoAnalysisFailureConsumedRef.current) return false;
      demoAnalysisFailureConsumedRef.current = true;
      return true;
    }

    const enabled =
      forceDemoGenerationError || query.get("demoGenerationError") === "1";
    if (!enabled || demoGenerationFailureConsumedRef.current) return false;
    demoGenerationFailureConsumedRef.current = true;
    return true;
  }

  function releaseGarmentPreview(garment: GarmentContext | null) {
    if (garment?.ownsPreviewUrl) URL.revokeObjectURL(garment.previewUrl);
  }

  function replaceCurrentGarment(nextGarment: GarmentContext) {
    const previousGarment = currentGarmentRef.current;
    updateCurrentGarment(nextGarment);
    setRecommendationGarment(nextGarment);
    if (
      previousGarment &&
      previousGarment.previewUrl !== nextGarment.previewUrl
    ) {
      releaseGarmentPreview(previousGarment);
    }
  }

  useEffect(() => {
    const uploadTimers = uploadTimersRef.current;
    const profileTimers = profileTimersRef.current;
    const tryOnTimers = tryOnTimersRef.current;

    return () => {
      uploadOperationIdRef.current += 1;
      uploadAbortControllerRef.current?.abort();
      uploadAbortControllerRef.current = null;
      profileOperationIdRef.current += 1;
      tryOnOperationIdRef.current += 1;
      uploadTimers.forEach((timer) => clearTimeout(timer));
      uploadTimers.clear();
      profileTimers.forEach((timer) => clearTimeout(timer));
      profileTimers.clear();
      tryOnTimers.forEach((timer) => clearTimeout(timer));
      tryOnTimers.clear();
      if (pendingPreviewUrlRef.current) {
        URL.revokeObjectURL(pendingPreviewUrlRef.current);
        pendingPreviewUrlRef.current = null;
      }
      releaseGarmentPreview(currentGarmentRef.current);
    };
  }, []);

  const savedLooks = useMemo(() => {
    const lookCatalog = [...looks, ...wardrobeDemoLooks];
    const saved = savedLookIds
      .map((id) => lookCatalog.find((look) => look.id === id))
      .filter(Boolean) as Look[];
    const savedIds = new Set(saved.map((look) => look.id));
    const demoLooks = wardrobeDemoLooks.filter(
      (look) => !savedIds.has(look.id),
    );

    return [...saved, ...demoLooks].slice(0, 30);
  }, [savedLookIds]);

  const pageTitle = useMemo(() => {
    if (view === "recommend") return "AI 推荐";
    if (view === "detail") return "Look 详情";
    if (view === "tryon") return "AI 试穿";
    if (view === "wardrobe") return "我的衣橱";
    if (view === "profile") return "我的形象";
    return "发现";
  }, [view]);

  function cancelUploadTaskForNavigation() {
    if (isUploadBusy(uploadFlowRef.current)) {
      invalidateUploadOperation();
      updateUploadFlow(
        currentGarmentRef.current ? { status: "preview" } : { status: "idle" },
      );
    }
    uploadModalRestoreFlowRef.current = null;
    uploadModalOpenedGarmentIdRef.current = null;
    setUploadOpen(false);
  }

  function cancelProfileTaskForNavigation() {
    if (
      profileStateRef.current.status === "profileSaving" ||
      profileStateRef.current.status === "profileSaved"
    ) {
      invalidateProfileOperation();
      updateProfileState({ status: "profileIdle" });
    }
  }

  function cancelTryOnTaskForNavigation() {
    if (tryOnStateRef.current.status !== "tryonRegenerating") return;
    invalidateTryOnOperation();
    updateTryOnState({ status: "tryonSuccess" });
  }

  function cancelPageTasksForNavigation() {
    cancelUploadTaskForNavigation();
    cancelProfileTaskForNavigation();
    cancelTryOnTaskForNavigation();
  }

  function goDiscover() {
    cancelPageTasksForNavigation();
    setView("discover");
    setMenuOpen(false);
  }

  function goWardrobe(tab: WardrobeTab = "looks") {
    cancelPageTasksForNavigation();
    setWardrobeTab(tab);
    setView("wardrobe");
    setMenuOpen(false);
  }

  function openDetail(look: Look, tab: DetailTab = "outfit") {
    cancelPageTasksForNavigation();
    setSelectedLook(look);
    setDetailTab(tab);
    setView("detail");
    setMenuOpen(false);
  }

  function startRecommendation(
    nextLook = looks[0],
    garment: GarmentContext | null = null,
  ) {
    cancelPageTasksForNavigation();
    setRecommendedLooks(looks);
    setHasGeneratedAiResults(true);
    setFirstLookImageFlow({ status: "idle" });
    setGenerationResult(null);
    setSelectedLook(nextLook);
    setIsNewUser(false);
    setRecommendationGarment(garment);
    updateUploadFlow({ status: "success" });
    setView("recommend");
  }

  function startRecommendationForItem(item: WardrobeItem) {
    const nextLook =
      looks.find((look) => look.id === item.recommendationLookId) ?? looks[0];

    startRecommendation(nextLook, {
      id: item.id,
      name: item.name,
      previewUrl: item.image,
      source: "wardrobe",
      ownsPreviewUrl: false,
      file: null,
    });
  }

  function beginTryOnRegeneration(targetVersion = profileVersionRef.current) {
    if (
      targetVersion <= renderedProfileVersionRef.current ||
      tryOnStateRef.current.status === "tryonRegenerating"
    ) {
      return;
    }

    const operationId = invalidateTryOnOperation();
    updateTryOnState({ status: "tryonRegenerating" });

    scheduleTryOnTask(operationId, () => {
      if (shouldFailTryOnRegeneration()) {
        updateTryOnState({
          status: "tryonError",
          message:
            "你的形象信息已经保存，当前仍显示上一次试穿结果。",
        });
        return;
      }

      updateRenderedProfileVersion(targetVersion);
      updateTryOnState({ status: "tryonSuccess" });
    }, tryOnRegenerationDelay);
  }

  function enterTryOn() {
    cancelUploadTaskForNavigation();
    cancelProfileTaskForNavigation();
    setView("tryon");
    if (
      profileComplete &&
      profileVersionRef.current > renderedProfileVersionRef.current
    ) {
      beginTryOnRegeneration(profileVersionRef.current);
    }
  }

  function handlePromptSubmit(value = prompt) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setPrompt("");
    setPromptOpen(false);
    setIsNewUser(false);
    setToast("正在为你生成新的穿搭方案");
    setTimeout(() => setToast(""), 1400);
    startRecommendation(looks[trimmed.includes("白衬衫") ? 0 : 1]);
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") handlePromptSubmit();
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    setView("discover");
  }

  async function getGarmentFile(
    garment: GarmentContext,
    signal: AbortSignal,
  ) {
    if (garment.file) return garment.file;

    const response = await fetch(garment.previewUrl, {
      signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("GARMENT_IMAGE_UNAVAILABLE");
    const blob = await response.blob();
    const type = acceptedImageTypes.has(blob.type) ? blob.type : "image/png";
    const extension =
      type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
    return new File([blob], `${garment.id}.${extension}`, { type });
  }

  function transitionToRecommendation(garment: GarmentContext) {
    uploadModalRestoreFlowRef.current = null;
    uploadModalOpenedGarmentIdRef.current = null;
    setUploadOpen(false);
    setRecommendationGarment(garment);
    setSelectedLook(recommendedLooks[0] ?? looks[0]);
    setIsNewUser(false);
    setView("recommend");
    updateUploadFlow({ status: "generating" });
  }

  function generationErrorCopy(
    stage: "weather" | "configuration" | "generation",
    message: string,
  ) {
    if (stage === "weather") {
      return {
        status: "error" as const,
        stage,
        title: "暂时无法获取天气",
        message,
      };
    }
    if (stage === "configuration") {
      return {
        status: "error" as const,
        stage,
        title: "AI 服务尚未配置",
        message,
      };
    }
    return {
      status: "error" as const,
      stage,
      title: "这次没有生成完成",
      message,
    };
  }

  async function requestFirstLookImage({
    image,
    lookId,
    plan,
    result,
    signal,
  }: {
    image: File;
    lookId: string;
    plan: GeneratedLookPlan;
    result: WardrobeAiResult;
    signal: AbortSignal;
  }) {
    const formData = new FormData();
    formData.set("image", image);
    formData.set("lookId", lookId);
    formData.set("scene", scene);
    formData.set("weatherSummary", result.weatherSummary);
    formData.set("look", JSON.stringify(plan));
    formData.set("garment", JSON.stringify(result.garment));

    const response = await fetch("/api/generate-look-image", {
      method: "POST",
      body: formData,
      signal,
    });

    return (await response.json()) as GenerateLookImageResponse;
  }

  async function requestAiLooks({
    garment,
    showAnalysis,
  }: {
    garment: GarmentContext;
    showAnalysis: boolean;
  }) {
    const operationId = invalidateUploadOperation();
    const controller = new AbortController();
    uploadAbortControllerRef.current = controller;
    setRecommendationGarment(garment);
    setHasGeneratedAiResults(false);
    setFirstLookImageFlow({ status: "idle" });

    let transitioned = !showAnalysis;
    let transitionedAt = transitioned ? Date.now() : 0;
    if (showAnalysis) {
      updateUploadFlow({ status: "analyzing" });
      scheduleUploadTask(operationId, () => {
        transitioned = true;
        transitionedAt = Date.now();
        transitionToRecommendation(garment);
      }, analysisTransitionDelay);
    } else {
      setView("recommend");
      updateUploadFlow({ status: "generating" });
    }

    let image: File;
    try {
      image = await getGarmentFile(garment, controller.signal);
    } catch {
      if (
        controller.signal.aborted ||
        uploadOperationIdRef.current !== operationId
      ) {
        return;
      }
      clearUploadTimers();
      updateUploadFlow({
        status: "error",
        stage: "image-read",
        title: "无法读取这张图片",
        message: "请重新选择 JPG、PNG 或 WebP 文件。",
      });
      return;
    }

    const formData = new FormData();
    formData.set("image", image);
    formData.set("city", city.trim());
    formData.set("scene", scene);
    formData.set(
      "preferences",
      profileComplete
        ? `身型：${bodyType}；肤色：${skinTone}；偏好简洁、实穿、优先复用已有衣物。`
        : "简洁、实穿、优先复用已有衣物。",
    );
    if (coordinates) {
      formData.set("latitude", String(coordinates.latitude));
      formData.set("longitude", String(coordinates.longitude));
    }

    let payload: GenerateLooksResponse;
    try {
      const response = await fetch("/api/generate-looks", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      payload = (await response.json()) as GenerateLooksResponse;
    } catch {
      if (
        controller.signal.aborted ||
        uploadOperationIdRef.current !== operationId
      ) {
        return;
      }
      if (!transitioned) {
        transitioned = true;
        transitionedAt = Date.now();
        transitionToRecommendation(garment);
      }
      clearUploadTimers();
      updateUploadFlow(
        generationErrorCopy(
          "generation",
          "网络连接中断。你上传的衣服仍然保留，可以直接重新生成。",
        ),
      );
      return;
    }

    if (
      controller.signal.aborted ||
      uploadOperationIdRef.current !== operationId
    ) {
      return;
    }

    if (!transitioned) {
      transitioned = true;
      transitionedAt = Date.now();
      transitionToRecommendation(garment);
    }

    if (!payload.ok) {
      clearUploadTimers();
      const stage =
        payload.error.stage === "weather" ||
        payload.error.stage === "configuration"
          ? payload.error.stage
          : "generation";
      updateUploadFlow(generationErrorCopy(stage, payload.error.message));
      return;
    }

    if (shouldFailDemoStage("generation")) {
      clearUploadTimers();
      updateUploadFlow(
        generationErrorCopy(
          "generation",
          "你上传的衣服仍然保留，可以直接重新生成。",
        ),
      );
      return;
    }

    let garmentImage = garment.previewUrl;
    if (garment.file) {
      try {
        garmentImage = await readFileAsDataUrl(garment.file, controller.signal);
      } catch {
        if (
          controller.signal.aborted ||
          uploadOperationIdRef.current !== operationId
        ) {
          return;
        }
      }
    }

    const nextLooks = buildAiLooks({
      result: payload.result,
      weather: payload.weather,
      garmentImage,
      scene,
      requestId: operationId,
    });
    const firstPlan = payload.result.looks[0];
    const firstLook = nextLooks[0];
    if (!firstPlan || !firstLook) {
      clearUploadTimers();
      updateUploadFlow(
        generationErrorCopy(
          "generation",
          "结构化推荐结果不完整，暂时无法生成推荐图片。",
        ),
      );
      return;
    }

    setFirstLookImageFlow({ status: "generating", lookId: firstLook.id });

    let imagePayload: GenerateLookImageResponse;
    try {
      imagePayload = await requestFirstLookImage({
        image,
        lookId: firstLook.id,
        plan: firstPlan,
        result: payload.result,
        signal: controller.signal,
      });
    } catch {
      if (
        controller.signal.aborted ||
        uploadOperationIdRef.current !== operationId
      ) {
        return;
      }
      clearUploadTimers();
      setFirstLookImageFlow({
        status: "error",
        lookId: firstLook.id,
        message: "图片生成请求中断，请重新生成。",
      });
      updateUploadFlow(
        generationErrorCopy(
          "generation",
          "图片生成请求中断，请重新生成。",
        ),
      );
      return;
    }

    if (
      controller.signal.aborted ||
      uploadOperationIdRef.current !== operationId
    ) {
      return;
    }

    if (!imagePayload.ok) {
      clearUploadTimers();
      const detail = [
        imagePayload.error.apiStatus
          ? `状态码 ${imagePayload.error.apiStatus}`
          : "",
        imagePayload.error.openAiType,
        imagePayload.error.openAiCode,
      ]
        .filter(Boolean)
        .join(" / ");
      const message = detail
        ? `${imagePayload.error.message}（${detail}）`
        : imagePayload.error.message;

      setFirstLookImageFlow({
        status: "error",
        lookId: firstLook.id,
        message,
      });
      updateUploadFlow(generationErrorCopy("generation", message));
      return;
    }

    const liveImageLooks = [
      {
        ...firstLook,
        image: imagePayload.image.src,
      },
      ...nextLooks.slice(1),
    ];
    const identifiedGarment = {
      ...garment,
      name: `${payload.result.garment.color}${payload.result.garment.category}`,
    };
    const finishSuccess = () => {
      if (uploadOperationIdRef.current !== operationId) return;
      uploadAbortControllerRef.current = null;
      clearUploadTimers();
      updateCurrentGarment(identifiedGarment);
      setRecommendationGarment(identifiedGarment);
      setGenerationResult(payload.result);
      setRecommendedLooks(liveImageLooks);
      setSelectedLook(liveImageLooks[0]);
      setHasGeneratedAiResults(true);
      setFirstLookImageFlow({
        status: "success",
        lookId: firstLook.id,
        model: imagePayload.image.model,
      });
      updateUploadFlow({ status: "success" });
    };
    const skeletonElapsed = Date.now() - transitionedAt;
    const remainingSkeletonTime = Math.max(0, 600 - skeletonElapsed);
    if (remainingSkeletonTime > 0) {
      scheduleUploadTask(operationId, finishSuccess, remainingSkeletonTime);
    } else {
      finishSuccess();
    }
  }

  function beginAnalysis(garment = currentGarmentRef.current) {
    if (!garment || isUploadBusy(uploadFlowRef.current)) return;
    if (!city.trim() && !coordinates) {
      updateUploadFlow({
        status: "error",
        stage: "weather",
        title: "还需要一个城市",
        message: "请输入城市，或允许浏览器获取当前位置。",
      });
      return;
    }

    void requestAiLooks({ garment, showAnalysis: true });
  }

  function beginGenerationAgain() {
    const garment = recommendationGarment;
    if (!garment || isUploadBusy(uploadFlowRef.current)) return;
    void requestAiLooks({ garment, showAnalysis: false });
  }

  function requestCurrentLocation() {
    if (isUploadBusy(uploadFlowRef.current)) return;
    if (!navigator.geolocation) {
      setLocationState({
        status: "error",
        message: "当前浏览器不支持定位，请输入城市。",
      });
      return;
    }

    setLocationState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setCity("");
        setLocationState({
          status: "success",
          message: "已获取当前位置",
        });
      },
      () => {
        setCoordinates(null);
        setLocationState({
          status: "error",
          message: "无法获取位置，请输入城市。",
        });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  function validateAndReadImage(file: File) {
    if (isUploadBusy(uploadFlowRef.current)) return;

    const operationId = invalidateUploadOperation();
    updateUploadFlow({ status: "validating" });

    if (file.size > maxUploadSize) {
      updateUploadFlow({
        status: "error",
        stage: "validation",
        title: "文件过大",
        message: "请选择小于 10MB 的图片。",
      });
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const hasAcceptedType = acceptedImageTypes.has(file.type);
    const hasAcceptedExtension = acceptedImageExtensions.has(extension);
    if (!hasAcceptedType || !hasAcceptedExtension) {
      updateUploadFlow({
        status: "error",
        stage: "validation",
        title: "无法读取这张图片",
        message: "请重新选择 JPG、PNG 或 WebP 文件。",
      });
      return;
    }

    let previewUrl: string;
    try {
      previewUrl = URL.createObjectURL(file);
    } catch {
      updateUploadFlow({
        status: "error",
        stage: "image-read",
        title: "无法读取这张图片",
        message: "请重新选择 JPG、PNG 或 WebP 文件。",
      });
      return;
    }

    pendingPreviewUrlRef.current = previewUrl;
    const image = new Image();
    image.decoding = "async";

    image.onload = () => {
      if (uploadOperationIdRef.current !== operationId) return;
      if (pendingPreviewUrlRef.current === previewUrl) {
        pendingPreviewUrlRef.current = null;
      }

      const garment: GarmentContext = {
        id: `upload-${operationId}-${Date.now()}`,
        name: getGarmentName(file.name),
        previewUrl,
        source: "upload",
        ownsPreviewUrl: true,
        file,
      };

      replaceCurrentGarment(garment);
      updateUploadFlow({ status: "preview" });
    };

    image.onerror = () => {
      if (uploadOperationIdRef.current !== operationId) return;
      if (pendingPreviewUrlRef.current === previewUrl) {
        URL.revokeObjectURL(previewUrl);
        pendingPreviewUrlRef.current = null;
      }
      updateUploadFlow({
        status: "error",
        stage: "image-read",
        title: "无法读取这张图片",
        message: "请重新选择 JPG、PNG 或 WebP 文件。",
      });
    };

    image.src = previewUrl;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) validateAndReadImage(file);
    event.target.value = "";
  }

  function pickUploadFile() {
    if (isUploadBusy(uploadFlowRef.current)) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  }

  function useOfficialGarment() {
    if (isUploadBusy(uploadFlowRef.current)) return;

    invalidateUploadOperation();
    const garment: GarmentContext = {
      id: "official-white-shirt",
      name: "白衬衫",
      previewUrl: "/images/wardrobe-item-shirt-hd.png",
      source: "official",
      ownsPreviewUrl: false,
      file: null,
    };

    replaceCurrentGarment(garment);
    updateUploadFlow({ status: "preview" });
    beginAnalysis(garment);
  }

  function openUploadModal() {
    uploadModalRestoreFlowRef.current = uploadFlowRef.current;
    uploadModalOpenedGarmentIdRef.current =
      currentGarmentRef.current?.id ?? null;
    invalidateUploadOperation();
    if (isUploadBusy(uploadFlowRef.current)) {
      updateUploadFlow(
        currentGarmentRef.current ? { status: "preview" } : { status: "idle" },
      );
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadOpen(true);
  }

  function closeUploadModal() {
    const restoreFlow = uploadModalRestoreFlowRef.current;
    const garmentUnchanged =
      (currentGarmentRef.current?.id ?? null) ===
      uploadModalOpenedGarmentIdRef.current;
    invalidateUploadOperation();
    updateUploadFlow(
      garmentUnchanged && restoreFlow
        ? restoreFlow
        : currentGarmentRef.current
          ? { status: "preview" }
          : { status: "idle" },
    );
    uploadModalRestoreFlowRef.current = null;
    uploadModalOpenedGarmentIdRef.current = null;
    setUploadOpen(false);
  }

  function saveLook() {
    setSavedLookIds((ids) =>
      ids.includes(selectedLook.id) ? ids : [selectedLook.id, ...ids],
    );
    setToast("已保存到我的衣橱");
    setTimeout(() => setToast(""), 1600);
    setTimeout(() => goWardrobe("looks"), 450);
  }

  function toggleFavorite(look: Look) {
    const wasFavorited = favoriteLookIds.includes(look.id);

    setFavoriteLookIds((ids) =>
      wasFavorited ? ids.filter((id) => id !== look.id) : [look.id, ...ids],
    );

    setToast(wasFavorited ? "已取消收藏" : "已收藏 Look");
    setTimeout(() => setToast(""), 1400);
  }

  function saveProfile() {
    if (
      profileStateRef.current.status === "profileSaving" ||
      profileStateRef.current.status === "profileSaved"
    ) {
      return;
    }

    const operationId = invalidateProfileOperation();
    updateProfileState({ status: "profileSaving" });

    scheduleProfileTask(operationId, () => {
      if (shouldFailProfileSave()) {
        updateProfileState({
          status: "profileError",
          message: "当前填写内容仍然保留，请重新保存。",
        });
        return;
      }

      const nextVersion = profileVersionRef.current + 1;
      setProfileComplete(true);
      updateProfileVersion(nextVersion);
      updateProfileState({ status: "profileSaved" });

      scheduleProfileTask(operationId, () => {
        updateProfileState({ status: "profileIdle" });
        if (profileReturn !== "tryon") return;

        setView("tryon");
        beginTryOnRegeneration(nextVersion);
      }, profileSavedHoldDelay);
    }, profileSaveDelay);
  }

  function handleProfileFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileUploadPreview(URL.createObjectURL(file));
  }

  function confirmProfilePhoto() {
    setProfileUploadOpen(false);
    setToast("自拍已上传");
    setTimeout(() => setToast(""), 1400);
  }

  if (view === "login") {
    return (
      <main className="login-page">
        <section className="login-panel">
          <div className="login-content">
            <div className="brand-mark" aria-label="MUNE">
              <img className="brand-logo-image" src="/mune-logo.svg" alt="" aria-hidden="true" />
            </div>
            <div className="login-copy">
              <h1>重新发现每一件衣服的价值</h1>
              <p>AI 帮助你充分利用已有衣物，生成更多完整穿搭。</p>
            </div>
            <form className="login-form" onSubmit={handleLogin}>
              <label>
                <span>邮箱</span>
                <input type="email" placeholder="请输入邮箱" defaultValue="demo@wardrobe.ai" />
              </label>
              <label>
                <span>密码</span>
                <div className="password-field">
                  <input type="password" placeholder="请输入密码" defaultValue="password" />
                  <button type="button" aria-label="显示密码">
                    ◦
                  </button>
                </div>
              </label>
              <button className="primary-btn login-submit" type="submit">
                登录
              </button>
            </form>
            <div className="login-links">
              <span>还没有账号？</span>
              <button type="button">注册账号</button>
              <button type="button">忘记密码？</button>
            </div>
          </div>
        </section>
        <section className="login-image-wrap" aria-label="产品视觉展示">
          <img
            src="/images/login-model-hd.png?v=20260724"
            alt="通勤穿搭模特"
            onError={(event) => applyImageFallback(event, "/images/login-model.jpg")}
          />
        </section>
      </main>
    );
  }

  return (
    <main
      className={`app-shell discover-experiment${view === "detail" ? " detail-experiment" : ""}`}
      onClick={() => promptOpen && setPromptOpen(false)}
    >
      <Sidebar
        active={view === "wardrobe" ? "wardrobe" : "discover"}
        menuOpen={menuOpen}
        addDisabled={isUploadBusy(uploadFlow)}
        onAdd={openUploadModal}
        onDiscover={goDiscover}
        onWardrobe={() => goWardrobe("looks")}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onProfile={() => {
          cancelPageTasksForNavigation();
          setProfileReturn(view === "tryon" ? "tryon" : "discover");
          setView("profile");
          setMenuOpen(false);
        }}
        onLogout={() => {
          cancelPageTasksForNavigation();
          setView("login");
        }}
      />

      <section className="workspace">
        <Header
          title={pageTitle}
          prompt={prompt}
          promptOpen={promptOpen}
          onPromptChange={setPrompt}
          onPromptFocus={() => setPromptOpen(true)}
          onPromptKeyDown={handlePromptKeyDown}
          onSubmitPrompt={handlePromptSubmit}
        />

        <section className="content-frame">
          {view === "discover" && (
            <Discover
              isNewUser={isNewUser}
              onAdd={openUploadModal}
              onOpenLook={() => openDetail(looks[0])}
            />
          )}

          {view === "recommend" && (
            <Recommend
              flow={uploadFlow}
              garment={recommendationGarment}
              looks={recommendedLooks}
              hasGeneratedResults={hasGeneratedAiResults}
              imageFlow={firstLookImageFlow}
              onOpen={(look) => openDetail(look)}
              onAdd={openUploadModal}
              onRetry={beginGenerationAgain}
              onChangeImage={openUploadModal}
            />
          )}

          {view === "detail" && (
            <LookDetail
              look={selectedLook}
              tab={detailTab}
              favorited={favoriteLookIds.includes(selectedLook.id)}
              onTab={setDetailTab}
              onTryOn={enterTryOn}
              onToggleFavorite={() => toggleFavorite(selectedLook)}
            />
          )}

          {view === "tryon" && (
            <TryOn
              look={selectedLook}
              profileComplete={profileComplete}
              state={tryOnState}
              profileVersion={profileVersion}
              renderedProfileVersion={renderedProfileVersion}
              onSave={saveLook}
              onRetry={() => beginTryOnRegeneration(profileVersion)}
              onProfile={() => {
                cancelTryOnTaskForNavigation();
                setProfileReturn("tryon");
                setView("profile");
              }}
              onBack={() => {
                cancelPageTasksForNavigation();
                setView("detail");
              }}
            />
          )}

          {view === "wardrobe" && (
            <Wardrobe
              tab={wardrobeTab}
              savedLooks={savedLooks}
              onTab={setWardrobeTab}
              onOpenLook={(look) => openDetail(look)}
              onOpenItem={startRecommendationForItem}
            />
          )}

          {view === "profile" && (
            <Profile
              bodyType={bodyType}
              skinTone={skinTone}
              state={profileState}
              onBodyType={setBodyType}
              onSkinTone={setSkinTone}
              onOpenUpload={() => setProfileUploadOpen(true)}
              onSave={saveProfile}
            />
          )}
        </section>
      </section>

      {uploadOpen && (
        <UploadModal
          flow={uploadFlow}
          garment={currentGarment}
          city={city}
          scene={scene}
          locationState={locationState}
          fileInputRef={fileInputRef}
          onClose={closeUploadModal}
          onCityChange={(nextCity) => {
            setCity(nextCity);
            setCoordinates(null);
            setLocationState({ status: "idle" });
          }}
          onSceneChange={setScene}
          onLocate={requestCurrentLocation}
          onFileChange={handleFileChange}
          onFileDrop={validateAndReadImage}
          onPickFile={pickUploadFile}
          onConfirm={() => beginAnalysis()}
          onOfficial={useOfficialGarment}
        />
      )}

      {profileUploadOpen && (
        <ProfilePhotoModal
          preview={profileUploadPreview}
          fileInputRef={profileFileInputRef}
          onClose={() => {
            setProfileUploadOpen(false);
            setProfileUploadPreview(null);
          }}
          onPickFile={() => profileFileInputRef.current?.click()}
          onFileChange={handleProfileFileChange}
          onConfirm={confirmProfilePhoto}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Sidebar({
  active,
  menuOpen,
  addDisabled,
  onAdd,
  onDiscover,
  onWardrobe,
  onToggleMenu,
  onProfile,
  onLogout,
}: {
  active: "discover" | "wardrobe";
  menuOpen: boolean;
  addDisabled: boolean;
  onAdd: () => void;
  onDiscover: () => void;
  onWardrobe: () => void;
  onToggleMenu: () => void;
  onProfile: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar">
      <div>
        <button className="logo-button" type="button" onClick={onDiscover} aria-label="返回发现">
          <img className="sidebar-brand-image" src="/mune-logo.svg" alt="" aria-hidden="true" />
        </button>
        <button className="add-button" type="button" onClick={onAdd} disabled={addDisabled}>
          <span>＋</span>
          添加衣服
        </button>
        <div className="sidebar-rule" />
        <nav className="side-nav" aria-label="主导航">
          <button
            className={active === "discover" ? "nav-item active" : "nav-item"}
            type="button"
            onClick={onDiscover}
          >
            <img className="nav-icon" src="/images/nav-discover-ui-full.png" alt="" />
            发现
          </button>
          <button
            className={active === "wardrobe" ? "nav-item active" : "nav-item"}
            type="button"
            onClick={onWardrobe}
          >
            <img className="nav-icon" src="/images/nav-wardrobe.png" alt="" />
            我的衣橱
          </button>
        </nav>
      </div>

      <div className="profile-entry-wrap">
        {menuOpen && (
          <div className="profile-menu" onClick={(event) => event.stopPropagation()}>
            <button className="hovered" type="button" onClick={onProfile}>
              <span>♙</span>
              我的形象
            </button>
            <button type="button">
              <span>⚙</span>
              设置
            </button>
            <button type="button" onClick={onLogout}>
              <span>↗</span>
              退出登录
            </button>
          </div>
        )}
        <button className="profile-entry" type="button" onClick={onToggleMenu}>
          <img className="avatar" src="/images/nav-user.png" alt="" />
          <span>用户名</span>
          <span className="chevron">⌄</span>
        </button>
      </div>
    </aside>
  );
}

function Header({
  title,
  prompt,
  promptOpen,
  onPromptChange,
  onPromptFocus,
  onPromptKeyDown,
  onSubmitPrompt,
}: {
  title: string;
  prompt: string;
  promptOpen: boolean;
  onPromptChange: (value: string) => void;
  onPromptFocus: () => void;
  onPromptKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSubmitPrompt: (value?: string) => void;
}) {
  return (
    <header className="app-header">
      <h1>{title}</h1>
      <div className="ai-prompt" onClick={(event) => event.stopPropagation()}>
        <span className="prompt-icon">✧</span>
        <input
          value={prompt}
          placeholder="今天想穿什么？"
          onChange={(event) => onPromptChange(event.target.value)}
          onFocus={onPromptFocus}
          onKeyDown={onPromptKeyDown}
        />
        {promptOpen && (
          <div className="prompt-popover">
            <button type="button" onClick={() => onSubmitPrompt("今天下雨怎么穿？")}>
              今天下雨怎么穿？
            </button>
            <button type="button" onClick={() => onSubmitPrompt("想穿白衬衫。")}>
              想穿白衬衫。
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Discover({
  isNewUser,
  onAdd,
  onOpenLook,
}: {
  isNewUser: boolean;
  onAdd: () => void;
  onOpenLook: () => void;
}) {
  return (
    <div className="discover-page">
      <section className="hero-copy">
        <h2>今天穿什么</h2>
      </section>

      <section className="home-hero-card">
        {isNewUser ? (
          <div className="hero-image hero-image-static">
            <img src="/images/home-look-hd.png" alt="完整穿搭示例" />
          </div>
        ) : (
          <button className="hero-image" type="button" onClick={onOpenLook}>
            <img src="/images/home-look-hd.png" alt="今日推荐 Look" />
          </button>
        )}

        <div className="hero-info">
          {isNewUser ? (
            <>
              <span className="hero-kicker">衣橱为空</span>
              <h3>添加第一件衣服</h3>
              <p className="hero-description">
                AI 会使用你已经拥有的衣服，为今天生成一套可以直接照着穿的完整 Look。
              </p>
              <button className="primary-btn cta-btn" type="button" onClick={onAdd}>
                添加第一件衣服
              </button>
            </>
          ) : (
            <>
              <div className="hero-meta" aria-label="今日穿搭信息">
                <span>今日推荐</span>
                <span>26°C</span>
                <span>通勤</span>
              </div>
              <h3>简约通勤 Look</h3>
              <p className="hero-description">白色无袖上衣搭配高腰阔腿裤，清爽利落。</p>
              <button className="primary-btn cta-btn" type="button" onClick={onOpenLook}>
                查看 Look
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Recommend({
  flow,
  garment,
  looks,
  hasGeneratedResults,
  imageFlow,
  onOpen,
  onAdd,
  onRetry,
  onChangeImage,
}: {
  flow: UploadFlowState;
  garment: GarmentContext | null;
  looks: Look[];
  hasGeneratedResults: boolean;
  imageFlow: LookImageFlowState;
  onOpen: (look: Look) => void;
  onAdd: () => void;
  onRetry: () => void;
  onChangeImage: () => void;
}) {
  const isGenerated = !garment || (flow.status === "success" && hasGeneratedResults);
  const isGenerating = garment !== null && flow.status === "generating";
  const generationError =
    flow.status === "error" &&
    (flow.stage === "weather" ||
      flow.stage === "configuration" ||
      flow.stage === "generation")
      ? flow
      : null;
  const showPreviousResults = Boolean(
    generationError && hasGeneratedResults && looks.length > 0,
  );
  const imageGenerationLabel =
    imageFlow.status === "generating"
      ? "正在生成第一套 Look 的真实图片。"
      : "";
  const heading = isGenerating
    ? "正在生成 3 套 Look"
    : generationError
      ? "上次结果仍可查看"
      : isGenerated
        ? "已生成 3 套 Look"
        : "准备生成新的 Look";

  return (
    <div className="recommend-page" aria-busy={isGenerating}>
      <div className="section-heading">
        <h2>{heading}</h2>
        <p>
          {garment
            ? isGenerating
              ? imageGenerationLabel ||
                `正在围绕「${garment.name}」尝试不同穿法与搭配。`
              : generationError
                ? `「${garment.name}」仍然保留，本次失败不会覆盖上一份结果。`
                : isGenerated
                  ? `以下方案均围绕「${garment.name}」生成。`
                  : `「${garment.name}」已保留，确认上传后即可重新生成。`
            : "全部来自你已经拥有的衣物。"}
        </p>
      </div>

      <div
        className="look-recommend-grid"
        aria-live="polite"
        aria-label={isGenerating ? "正在生成推荐结果" : "推荐结果"}
      >
        {isGenerating &&
          looks.map((look) => (
            <div className="look-result-skeleton" key={look.id} aria-hidden="true">
              <span />
            </div>
          ))}

        {generationError && (
          <section
            className={`recommend-inline-error${showPreviousResults ? " with-results" : ""}`}
            role="alert"
          >
            <div>
              <h3>{generationError.title}</h3>
              <p>{generationError.message}</p>
            </div>
            <div className="recommend-error-actions">
              <button className="primary-btn" type="button" onClick={onRetry}>
                重新生成
              </button>
              <button className="outline-btn" type="button" onClick={onChangeImage}>
                更换图片
              </button>
            </div>
          </section>
        )}

        {(isGenerated || showPreviousResults) &&
          looks.map((look) => (
            <button
              className="look-card look-result-ready"
              key={look.id}
              type="button"
              onClick={() => onOpen(look)}
            >
              <img src={look.image} alt={look.name} />
            </button>
          ))}

        {garment && !isGenerating && !generationError && !isGenerated && (
          <section className="recommend-inline-error recommend-inline-paused">
            <div>
              <h3>这件衣服还没有生成 Look</h3>
              <p>图片仍然保留，确认后即可重新开始。</p>
            </div>
            <div className="recommend-error-actions">
              <button className="primary-btn" type="button" onClick={onChangeImage}>
                继续上传
              </button>
            </div>
          </section>
        )}
      </div>

      <button
        className="secondary-inline"
        type="button"
        onClick={onAdd}
        disabled={isGenerating}
      >
        重新选择单品
      </button>
    </div>
  );
}

function LookDetail({
  look,
  tab,
  favorited,
  onTab,
  onTryOn,
  onToggleFavorite,
}: {
  look: Look;
  tab: DetailTab;
  favorited: boolean;
  onTab: (tab: DetailTab) => void;
  onTryOn: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="detail-page">
      <section className="detail-look-card">
        <div className="detail-photo-wrap">
          <img src={look.detailImage} alt={look.name} />
          <button
            className={favorited ? "heart-btn active" : "heart-btn"}
            type="button"
            aria-label={favorited ? "取消收藏 Look" : "收藏 Look"}
            aria-pressed={favorited}
            onClick={onToggleFavorite}
          >
            {favorited ? "♥" : "♡"}
          </button>
        </div>
      </section>

      <section className="detail-panel">
        <h2>{look.name}</h2>
        <div className="tags-row">
          <span>{look.scene}</span>
          <span>{look.weather}</span>
        </div>

        <div className="segmented" role="tablist" aria-label="Look 信息">
          <button
            className={tab === "outfit" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={tab === "outfit"}
            onClick={() => onTab("outfit")}
          >
            本次搭配
          </button>
          <button
            className={tab === "tutorial" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={tab === "tutorial"}
            onClick={() => onTab("tutorial")}
          >
            穿法教程
          </button>
        </div>

        {tab === "outfit" ? (
          <OutfitList items={look.outfitItems} />
        ) : (
          <TutorialList steps={look.tutorialSteps} />
        )}

        <button className="primary-btn try-btn" type="button" onClick={onTryOn}>
          开始试穿
        </button>
      </section>
    </div>
  );
}

function OutfitList({ items }: { items: LookOutfitItem[] }) {
  return (
    <div className="outfit-list">
      {items.map((item) => (
        <article className="outfit-row" key={item.id}>
          <img src={item.image} alt={item.name} />
          <strong>{item.name}</strong>
          <span>{item.method}</span>
        </article>
      ))}
    </div>
  );
}

function TutorialList({ steps }: { steps: TutorialStep[] }) {
  return (
    <div className="tutorial-grid">
      {steps.map((step) => (
        <article className="tutorial-card" key={step.id}>
          <img src={step.image} alt={step.title} />
          <strong>{step.title}</strong>
          <p>{step.body}</p>
        </article>
      ))}
    </div>
  );
}

function TryOn({
  look,
  profileComplete,
  state,
  profileVersion,
  renderedProfileVersion,
  onSave,
  onRetry,
  onProfile,
  onBack,
}: {
  look: Look;
  profileComplete: boolean;
  state: TryOnState;
  profileVersion: number;
  renderedProfileVersion: number;
  onSave: () => void;
  onRetry: () => void;
  onProfile: () => void;
  onBack: () => void;
}) {
  const regenerating = state.status === "tryonRegenerating";
  const failed = state.status === "tryonError";
  const usesCurrentProfile =
    state.status === "tryonSuccess" &&
    profileVersion > 0 &&
    renderedProfileVersion === profileVersion;
  const resultOutdated =
    profileComplete && renderedProfileVersion < profileVersion;
  const canSave =
    state.status === "tryonSuccess" && !resultOutdated;
  const resultImage =
    renderedProfileVersion > 0 ? look.detailImage : look.tryOnImage;

  return (
    <div className="tryon-page">
      <section className="tryon-photo" aria-busy={regenerating}>
        <img
          className="tryon-result-image"
          key={`${look.id}-${renderedProfileVersion}`}
          src={resultImage}
          alt="AI 试穿效果"
        />
        {regenerating && (
          <div className="tryon-update-overlay" role="status" aria-live="polite">
            <div>
              <strong>正在更新试穿效果</strong>
              <span>正在根据新的身高、身型和照片重新生成这套 Look。</span>
            </div>
          </div>
        )}
      </section>

      <section className="tryon-panel">
        <span className="eyebrow">当前穿搭</span>
        <h3>{look.name}</h3>
        <span className="weather-pill">☼ {look.weather}</span>
        <div className="divider" />
        <span className="eyebrow">当前形象</span>
        <div className="profile-prompt tryon-profile-status" aria-live="polite">
          <img className="mini-avatar" src="/images/ui-profile-avatar.jpg" alt="" />
          {regenerating ? (
            <p>
              <strong>专属形象已保存</strong>
              <span>正在根据新的形象信息更新试穿效果。</span>
            </p>
          ) : failed ? (
            <p>
              <strong>新的试穿效果没有生成完成</strong>
              <span>{state.message}</span>
            </p>
          ) : usesCurrentProfile ? (
            <p>
              <strong>当前使用：我的专属形象</strong>
              <span>已根据你的形象更新试穿效果。</span>
            </p>
          ) : profileComplete ? (
            <p>
              <strong>专属形象已保存</strong>
              <span>当前仍显示上一次试穿结果。</span>
            </p>
          ) : (
            <p>
              <strong>完善我的形象，</strong>
              <span>可获得更准确的试穿效果。</span>
            </p>
          )}
        </div>
        <button
          className="primary-btn wide"
          type="button"
          onClick={onSave}
          disabled={!canSave}
          aria-describedby={failed ? "tryon-save-reason" : undefined}
        >
          保存穿搭
        </button>
        <p
          className={failed ? "tryon-save-note visible" : "tryon-save-note"}
          id="tryon-save-reason"
        >
          {failed
            ? "当前显示的是上一次试穿结果，重新生成后即可保存。"
            : ""}
        </p>
        {failed ? (
          <div className="tryon-error-actions">
            <button className="primary-btn" type="button" onClick={onRetry}>
              重新生成
            </button>
            <button className="outline-btn" type="button" onClick={onProfile}>
              返回我的形象
            </button>
          </div>
        ) : (
          <button
            className="outline-btn wide"
            type="button"
            onClick={onProfile}
            disabled={regenerating}
          >
            {profileComplete ? "更新我的形象" : "完善我的形象"}
          </button>
        )}
        <button className="text-btn" type="button" onClick={onBack}>
          返回 Look
        </button>
      </section>
    </div>
  );
}

function Wardrobe({
  tab,
  savedLooks,
  onTab,
  onOpenLook,
  onOpenItem,
}: {
  tab: WardrobeTab;
  savedLooks: Look[];
  onTab: (tab: WardrobeTab) => void;
  onOpenLook: (look: Look) => void;
  onOpenItem: (item: WardrobeItem) => void;
}) {
  return (
    <div className="wardrobe-page">
      <div className="wardrobe-tabs">
        <button
          className={tab === "looks" ? "active" : ""}
          type="button"
          onClick={() => onTab("looks")}
        >
          Look
        </button>
        <button
          className={tab === "items" ? "active" : ""}
          type="button"
          onClick={() => onTab("items")}
        >
          单品
        </button>
      </div>

      {tab === "looks" ? (
        <div className="saved-look-grid">
          {savedLooks.map((look) => (
            <button
              className="saved-look-card"
              key={look.id}
              data-look-id={look.id}
              type="button"
              onClick={() => onOpenLook(look)}
              aria-label={`查看${look.name}`}
            >
              <img
                src={`${look.image}?v=20260724`}
                alt={look.name}
                onError={(event) =>
                  applyImageFallback(
                    event,
                    wardrobeLookFallbacks[look.image] ?? look.image,
                  )
                }
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="item-masonry">
          {wardrobeGalleryItems.map((item) => (
            <button
              className="item-card"
              key={item.id}
              data-item-id={item.id}
              type="button"
              onClick={() => onOpenItem(item)}
              aria-label={`查看${item.name}`}
            >
              <img src={item.image} alt={item.name} />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

function Profile({
  bodyType,
  skinTone,
  state,
  onBodyType,
  onSkinTone,
  onOpenUpload,
  onSave,
}: {
  bodyType: string;
  skinTone: string;
  state: ProfileState;
  onBodyType: (type: string) => void;
  onSkinTone: (tone: string) => void;
  onOpenUpload: () => void;
  onSave: () => void;
}) {
  const busy =
    state.status === "profileSaving" || state.status === "profileSaved";
  const saveLabel =
    state.status === "profileSaving"
      ? "正在保存…"
      : state.status === "profileSaved"
        ? "已保存"
        : state.status === "profileError"
          ? "重新保存"
          : "保存";

  return (
    <div className="profile-page">
      <section className="profile-preview">
        <img src="/images/profile-model-hd.png" alt="我的形象预览" />
      </section>

      <section className="profile-form" aria-busy={busy}>
        <p className="form-intro">完善基础信息，AI 将生成更贴近你的专属形象，用于穿搭推荐与 AI 试穿。</p>
        <div className="form-row">
          <label className="height-field">
            <span>身高</span>
            <div>
              <input placeholder="请输入身高" defaultValue="168" disabled={busy} />
              <em>cm</em>
            </div>
          </label>

          <div className="skin-field">
            <span>肤色</span>
            <div>
              {["浅", "自然", "深"].map((tone, index) => (
                <button
                  className={skinTone === tone ? "skin selected" : "skin"}
                  style={{ "--tone": ["#f0c8aa", "#e2b890", "#b58c71"][index] } as CSSProperties}
                  key={tone}
                  type="button"
                  aria-pressed={skinTone === tone}
                  onClick={() => onSkinTone(tone)}
                  disabled={busy}
                >
                  <i />
                  {tone}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="body-type-field">
          <h3>选择你的身型</h3>
          <div className="body-grid">
            {profileBodyTypes.map((type) => (
              <button
                className={bodyType === type ? "body-card selected" : "body-card"}
                key={type}
                type="button"
                aria-pressed={bodyType === type}
                onClick={() => onBodyType(type)}
                disabled={busy}
              >
                <img className="body-reference" src={profileBodyImages[type]} alt="" />
                <strong>{type}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="selfie-upload">
          <span className="upload-icon">↥</span>
          <p>上传自拍后，AI 将自动识别发型、五官等特征，进一步优化试穿效果。</p>
          <button
            className="outline-btn"
            type="button"
            onClick={onOpenUpload}
            disabled={busy}
          >
            上传照片
          </button>
        </div>

        <p className="muted-note">不上传也可以继续使用。</p>
        {state.status === "profileError" && (
          <div className="profile-save-error" role="alert">
            <strong>形象信息没有保存成功</strong>
            <span>{state.message}</span>
          </div>
        )}
        <button
          className="primary-btn save-profile"
          type="button"
          onClick={onSave}
          disabled={busy}
          aria-busy={state.status === "profileSaving"}
        >
          {saveLabel}
        </button>
      </section>
    </div>
  );
}

function ProfilePhotoModal({
  preview,
  fileInputRef,
  onClose,
  onPickFile,
  onFileChange,
  onConfirm,
}: {
  preview: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onPickFile: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-wash" onClick={onClose}>
      <section className="profile-photo-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <h2>上传自拍</h2>
          <button type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <button className="profile-photo-zone" type="button" onClick={onPickFile}>
          {preview ? (
            <img src={preview} alt="自拍预览" />
          ) : (
            <>
              <span>↥</span>
              <strong>点击上传一张正面照片</strong>
              <em>不上传也可以继续使用。</em>
            </>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} hidden />
        <div className="profile-photo-actions">
          <button className="outline-btn" type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-btn" type="button" onClick={preview ? onConfirm : onPickFile}>
            {preview ? "确认上传" : "选择照片"}
          </button>
        </div>
      </section>
    </div>
  );
}

function UploadModal({
  flow,
  garment,
  city,
  scene,
  locationState,
  fileInputRef,
  onClose,
  onCityChange,
  onSceneChange,
  onLocate,
  onFileChange,
  onFileDrop,
  onPickFile,
  onConfirm,
  onOfficial,
}: {
  flow: UploadFlowState;
  garment: GarmentContext | null;
  city: string;
  scene: Scene;
  locationState: LocationState;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onCityChange: (city: string) => void;
  onSceneChange: (scene: Scene) => void;
  onLocate: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
  onPickFile: () => void;
  onConfirm: () => void;
  onOfficial: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const busy = isUploadBusy(flow);
  const localError =
    flow.status === "error" && flow.stage !== "generation" ? flow : null;
  const analysisError = localError?.stage === "analysis";
  const retryableWithGarment =
    analysisError ||
    localError?.stage === "weather" ||
    localError?.stage === "configuration";

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  }

  function handlePrimaryAction() {
    if (busy) return;
    if (garment && (!localError || retryableWithGarment)) {
      onConfirm();
      return;
    }
    onPickFile();
  }

  const primaryLabel =
    flow.status === "validating"
      ? "正在校验..."
      : flow.status === "analyzing"
        ? "正在识别..."
          : flow.status === "preview"
          ? "确认上传"
          : retryableWithGarment
            ? "重新识别"
            : localError
              ? "重新选择"
              : garment
                ? "确认上传"
                : "上传照片";

  return (
    <div className="modal-wash" onClick={onClose}>
      <section
        className="upload-modal"
        aria-busy={busy}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>添加衣服</h2>
          <button type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="upload-layout">
          <div className="upload-primary">
            <h3>上传我的衣服</h3>
            <div
              className={`drop-zone${garment ? " has-preview" : ""}${dragActive ? " drag-active" : ""}${busy ? " disabled" : ""}`}
              role={garment ? "group" : "button"}
              tabIndex={garment || busy ? -1 : 0}
              aria-disabled={busy}
              aria-label={garment ? "更换衣服图片" : "选择衣服图片"}
              onClick={() => !garment && !busy && onPickFile()}
              onKeyDown={(event) => {
                if (
                  !garment &&
                  !busy &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  onPickFile();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!busy) setDragActive(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) setDragActive(false);
              }}
              onDrop={handleDrop}
            >
              {garment ? (
                <>
                  <img src={garment.previewUrl} alt={`${garment.name}预览`} />
                  <button
                    className="replace-upload"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onPickFile();
                    }}
                    disabled={busy}
                  >
                    重新选择
                  </button>
                </>
              ) : (
                <>
                  <span>↥</span>
                  <strong>点击或拖拽上传图片</strong>
                  <em>JPG、PNG 或 WebP，不超过 10MB</em>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              disabled={busy}
              hidden
            />

            <div className="generation-options">
              <label className="city-field">
                <span>城市</span>
                <div>
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => onCityChange(event.target.value)}
                    placeholder="例如：上海"
                    disabled={busy}
                    autoComplete="address-level2"
                  />
                  <button
                    className="outline-btn"
                    type="button"
                    onClick={onLocate}
                    disabled={busy || locationState.status === "locating"}
                  >
                    {locationState.status === "locating"
                      ? "定位中..."
                      : "使用定位"}
                  </button>
                </div>
                {locationState.status === "success" && (
                  <em role="status">{locationState.message}</em>
                )}
                {locationState.status === "error" && (
                  <em className="field-error" role="alert">
                    {locationState.message}
                  </em>
                )}
              </label>

              <fieldset className="scene-field" disabled={busy}>
                <legend>场景</legend>
                <div>
                  {scenes.map((option) => (
                    <button
                      className={scene === option ? "active" : ""}
                      type="button"
                      key={option}
                      aria-pressed={scene === option}
                      onClick={() => onSceneChange(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {flow.status === "validating" && (
              <div className="upload-inline-status" role="status" aria-live="polite">
                <strong>正在校验图片</strong>
                <span>正在确认文件格式与图片内容。</span>
              </div>
            )}

            {flow.status === "analyzing" && (
              <div className="upload-inline-status" role="status" aria-live="polite">
                <strong>正在识别这件衣服</strong>
                <span>AI 正在分析衣服的轮廓、版型和类别。</span>
              </div>
            )}

            {localError && (
              <div className="upload-inline-error" role="alert">
                <strong>{localError.title}</strong>
                <span>{localError.message}</span>
              </div>
            )}

            <button
              className="primary-btn modal-action"
              type="button"
              onClick={handlePrimaryAction}
              disabled={busy}
              aria-busy={busy}
            >
              {primaryLabel}
            </button>
            <p>建议使用纯色背景拍摄衣物。</p>
          </div>

          <div className="official-card">
            <h3>体验官方案例</h3>
            <div>
              <img src="/images/wardrobe-item-shirt-hd.png" alt="白衬衫官方案例" />
              <strong>白衬衫</strong>
              <button
                className="outline-btn"
                type="button"
                onClick={onOfficial}
                disabled={busy}
              >
                {flow.status === "analyzing" && garment?.source === "official"
                  ? "正在识别..."
                  : "立即体验"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
