import { createHash } from "crypto";
import { ImageResponse } from "@vercel/og";
import {
  buildOutageTableElement,
  buildCombinedOutageTableElement,
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  COMBINED_IMAGE_WIDTH,
  COMBINED_IMAGE_HEIGHT,
} from "../presentation/outageTableImage.js";
import { toUADayMonthFromUnix } from "../utils/dateUtils.js";
import { hasAnyOutage } from "../utils/helpers.js";
import { redis } from "../lib/redis.js";
import type { OgElement, ScheduleData } from "../types.js";

const FALLBACK_IMAGE_URL = "https://y2.vyshgorod.in.ua/dtek_data/images/kyiv-region/today.png";
const CACHE_KEY_PREFIX = "outage-image:";
const CACHE_TTL_SECONDS = 86400; // 24h

let fontCache: ArrayBuffer | null = null;

const GOOGLE_FONTS_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@700&subset=cyrillic";

const fetchGoogleFontsCss = async (): Promise<string> => {
  return fetch(GOOGLE_FONTS_CSS_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then((r) => r.text());
};

const extractFontUrlFromCss = (css: string): string => {
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error("Failed to parse font URL from Google Fonts CSS");
  return match[1];
};

const loadFont = async (): Promise<ArrayBuffer> => {
  if (fontCache) return fontCache;

  const css = await fetchGoogleFontsCss();
  const fontUrl = extractFontUrlFromCss(css);
  fontCache = await fetch(fontUrl).then((r) => r.arrayBuffer());
  return fontCache!;
};

const generateTableImage = async (
  element: OgElement,
  width: number,
  height: number,
): Promise<Buffer> => {
  const fontData = await loadFont();

  const response = new ImageResponse(element, {
    width,
    height,
    fonts: [{ name: "Inter", data: fontData, weight: 700, style: "normal" }],
  });

  return Buffer.from(await response.arrayBuffer());
};

const fetchFallbackImage = async (): Promise<Buffer> => {
  const res = await fetch(`${FALLBACK_IMAGE_URL}?v=${Date.now()}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(1000),
  });

  if (!res.ok) throw new Error(`Failed to fetch fallback image: ${res.status}`);

  return Buffer.from(await res.arrayBuffer());
};

const buildCacheKey = (scheduleData: ScheduleData, hasTomorrow: boolean): string => {
  const payload: Record<string, unknown> = {
    today: scheduleData.hoursDataToday,
    todayUNIX: scheduleData.todayUNIX,
  };

  if (hasTomorrow) {
    payload.tomorrow = scheduleData.hoursDataTomorrow;
    payload.tomorrowUNIX = scheduleData.tomorrowUNIX;
  }

  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
  return `${CACHE_KEY_PREFIX}${hash}`;
};

const getCachedImage = async (cacheKey: string): Promise<Buffer | null> => {
  try {
    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      console.log("Image cache hit:", cacheKey);
      return Buffer.from(cached, "base64");
    }
  } catch (err) {
    console.error("Redis cache read failed:", err);
  }
  return null;
};

const setCachedImage = async (cacheKey: string, imageBuffer: Buffer): Promise<void> => {
  try {
    const base64 = imageBuffer.toString("base64");
    await redis.set(cacheKey, base64, { ex: CACHE_TTL_SECONDS });
  } catch (err) {
    console.error("Redis cache write failed:", err);
  }
};

export const getOutageImage = async (scheduleData: ScheduleData | null): Promise<Buffer | null> => {
  try {
    if (!scheduleData?.hoursDataToday) throw new Error("No schedule data");

    const hasTomorrow =
      !!scheduleData.hoursDataTomorrow && hasAnyOutage(scheduleData.hoursDataTomorrow);

    const cacheKey = buildCacheKey(scheduleData, hasTomorrow);
    const cached = await getCachedImage(cacheKey);
    if (cached) return cached;

    let image: Buffer;

    if (hasTomorrow) {
      const todayLabel = toUADayMonthFromUnix(scheduleData.todayUNIX);
      const tomorrowLabel = toUADayMonthFromUnix(scheduleData.tomorrowUNIX);
      const element = buildCombinedOutageTableElement(
        scheduleData.hoursDataToday,
        todayLabel,
        scheduleData.hoursDataTomorrow!,
        tomorrowLabel,
      );
      image = await generateTableImage(element, COMBINED_IMAGE_WIDTH, COMBINED_IMAGE_HEIGHT);
    } else {
      const dateLabel = toUADayMonthFromUnix(scheduleData.todayUNIX);
      const element = buildOutageTableElement(scheduleData.hoursDataToday, dateLabel);
      image = await generateTableImage(element, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    await setCachedImage(cacheKey, image);
    return image;
  } catch (err) {
    console.error("Generated image failed, trying fallback:", err);
  }

  try {
    return await fetchFallbackImage();
  } catch (err) {
    console.error("Fallback image failed:", err);
    return null;
  }
};
