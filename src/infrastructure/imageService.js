const getTodayImageURL = () => {
  const TODAY_IMAGE_URL = "https://y2.vyshgorod.in.ua/dtek_data/images/kyiv-region/today.png";

  return `${TODAY_IMAGE_URL}?v=${Date.now()}`;
};

export const getOutageScheduleImageBuffer = async () => {
  try {
    const imgUrl = getTodayImageURL();

    const res = await fetch(imgUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(1000),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error fetching outage schedule image:", error);
    return null;
  }
};
