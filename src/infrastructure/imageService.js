import { ImageResponse } from "@vercel/og";
import {
  buildOutageTableElement,
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
} from "../presentation/outageTableImage.js";
import { getTodayHoursData } from "../services/outageService.js";
import { toUADayMonthFromUnix } from "../utils/dateUtils.js";

const FALLBACK_IMAGE_URL = "https://y2.vyshgorod.in.ua/dtek_data/images/kyiv-region/today.png";

// Font cache - persists across function invocations
let fontCache = null;

// Single image cache with validation
let cachedImage = null;
let cachedKey = null;

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

// Create a hash key from the data
const createCacheKey = (hoursData, dateLabel) => {
  return JSON.stringify({ hoursData, dateLabel });
};

// Validate that cached image is still valid
const isCacheValid = (cacheKey) => {
  return (
    cachedImage !== null &&
    cachedKey !== null &&
    cachedKey === cacheKey &&
    Buffer.isBuffer(cachedImage) &&
    cachedImage.length > 0
  );
};

const generateTableImage = async (hoursData, dateLabel) => {
  const cacheKey = createCacheKey(hoursData, dateLabel);

  // Check if cached image is valid and matches current data
  if (isCacheValid(cacheKey)) {
    console.log("Cache hit - reusing generated image");
    return cachedImage;
  }

  console.log(cachedImage ? "Cache invalid - regenerating" : "Cache miss - generating new image");

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

  // Replace cache with new image
  cachedImage = imageBuffer;
  cachedKey = cacheKey;

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

export const getOutageImage = async (dtekResponse) => {
  try {
    const result = getTodayHoursData(dtekResponse);
    if (result) {
      const dateLabel = toUADayMonthFromUnix(result.todayUNIX);
      return await generateTableImage(result.hoursData, dateLabel);
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
