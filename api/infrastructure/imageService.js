export function getTodayImageURL() {
  const TODAY_IMAGE_URL = "https://y2.vyshgorod.in.ua/dtek_data/images/kyiv-region/today.png";

  return `${TODAY_IMAGE_URL}?v=${Date.now()}`;
}

export const checkImageExists = async (url) => {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch (error) {
    console.error("Error checking image:", error.message);
    return false;
  }
};
