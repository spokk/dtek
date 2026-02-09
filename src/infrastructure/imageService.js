import { ImageResponse } from "@vercel/og";
import {
  buildOutageTableElement,
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
} from "../presentation/outageTableImage.js";
import { toUADayMonthFromUnix } from "../utils/dateUtils.js";

const FALLBACK_IMAGE_URL = "https://y2.vyshgorod.in.ua/dtek_data/images/kyiv-region/today.png";

// Font cache - persists across function invocations
let fontCache = null;

const imageCache = new Map();

const GOOGLE_FONTS_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@700&subset=cyrillic";

const fetchGoogleFontsCss = async () => {
  return fetch(GOOGLE_FONTS_CSS_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then((r) => r.text());
};

const extractFontUrlFromCss = (css) => {
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error("Failed to parse font URL from Google Fonts CSS");
  return match[1];
};

const loadFont = async () => {
  if (fontCache) return fontCache;

  const css = await fetchGoogleFontsCss();
  const fontUrl = extractFontUrlFromCss(css);
  fontCache = await fetch(fontUrl).then((r) => r.arrayBuffer());
  return fontCache;
};

const createCacheKey = (hoursData, dateLabel) => {
  return JSON.stringify({ hoursData, dateLabel });
};

const generateTableImage = async (hoursData, dateLabel) => {
  const cacheKey = createCacheKey(hoursData, dateLabel);

  const cached = imageCache.get(cacheKey);
  if (cached && Buffer.isBuffer(cached) && cached.length > 0) {
    console.log("Cache hit - reusing generated image");
    return cached;
  }

  console.log(imageCache.size ? "Cache miss - generating new image" : "Cache empty - generating");

  const [fontData, element] = await Promise.all([
    loadFont(),
    Promise.resolve(buildOutageTableElement(hoursData, dateLabel)),
  ]);

  const response = new ImageResponse(element, {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    fonts: [{ name: "Inter", data: fontData, weight: 700, style: "normal" }],
  });

  const imageBuffer = Buffer.from(await response.arrayBuffer());

  imageCache.set(cacheKey, imageBuffer);

  return imageBuffer;
};

const fetchFallbackImage = async () => {
  const res = await fetch(`${FALLBACK_IMAGE_URL}?v=${Date.now()}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(1000),
  });

  if (!res.ok) throw new Error(`Failed to fetch fallback image: ${res.status}`);

  return Buffer.from(await res.arrayBuffer());
};

const hasAnyOutage = (hoursData) => Object.values(hoursData || {}).some((v) => v !== "yes");

export const getOutageImages = async (scheduleData) => {
  imageCache.clear();

  const [todayImage, tomorrowImage] = await Promise.all([
    generateTodayImage(scheduleData),
    generateTomorrowImage(scheduleData),
  ]);

  return { todayImage, tomorrowImage };
};

const generateTodayImage = async (scheduleData) => {
  try {
    if (scheduleData?.hoursDataToday) {
      const dateLabel = toUADayMonthFromUnix(scheduleData.todayUNIX);
      return await generateTableImage(scheduleData.hoursDataToday, dateLabel);
    }
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

const generateTomorrowImage = async (scheduleData) => {
  try {
    if (scheduleData?.hoursDataTomorrow && hasAnyOutage(scheduleData.hoursDataTomorrow)) {
      const dateLabel = toUADayMonthFromUnix(scheduleData.tomorrowUNIX);
      return await generateTableImage(scheduleData.hoursDataTomorrow, dateLabel);
    }
  } catch (err) {
    console.error("Tomorrow image generation failed:", err);
  }

  return null;
};
