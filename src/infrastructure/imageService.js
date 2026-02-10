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

const FALLBACK_IMAGE_URL = "https://y2.vyshgorod.in.ua/dtek_data/images/kyiv-region/today.png";

let fontCache = null;

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

const generateTableImage = async (element, width, height) => {
  const fontData = await loadFont();

  const response = new ImageResponse(element, {
    width,
    height,
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

export const getOutageImage = async (scheduleData) => {
  try {
    const hasToday = !!scheduleData?.hoursDataToday;
    const hasTomorrow =
      !!scheduleData?.hoursDataTomorrow && hasAnyOutage(scheduleData.hoursDataTomorrow);

    if (hasToday && hasTomorrow) {
      const todayLabel = toUADayMonthFromUnix(scheduleData.todayUNIX);
      const tomorrowLabel = toUADayMonthFromUnix(scheduleData.tomorrowUNIX);
      const element = buildCombinedOutageTableElement(
        scheduleData.hoursDataToday,
        todayLabel,
        scheduleData.hoursDataTomorrow,
        tomorrowLabel,
      );
      return await generateTableImage(element, COMBINED_IMAGE_WIDTH, COMBINED_IMAGE_HEIGHT);
    }

    if (hasToday) {
      const dateLabel = toUADayMonthFromUnix(scheduleData.todayUNIX);
      const element = buildOutageTableElement(scheduleData.hoursDataToday, dateLabel);
      return await generateTableImage(element, IMAGE_WIDTH, IMAGE_HEIGHT);
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
