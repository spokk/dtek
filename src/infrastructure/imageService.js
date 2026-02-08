import { ImageResponse } from "@vercel/og";
import {
  buildOutageTableElement,
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
} from "../presentation/outageTableImage.js";
import { getTodayHoursData } from "../services/outageService.js";
import { toUADayMonthFromUnix } from "../utils/dateUtils.js";

const FALLBACK_IMAGE_URL = "https://y2.vyshgorod.in.ua/dtek_data/images/kyiv-region/today.png";
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
  const css = await fetchGoogleFontsCss();
  const fontUrl = extractFontUrlFromCss(css);
  return fetch(fontUrl).then((r) => r.arrayBuffer());
};

const generateTableImage = async (hoursData, dateLabel) => {
  const element = buildOutageTableElement(hoursData, dateLabel);
  const fontData = await loadFont();

  const response = new ImageResponse(element, {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    fonts: [{ name: "Inter", data: fontData, weight: 700, style: "normal" }],
  });

  return Buffer.from(await response.arrayBuffer());
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
