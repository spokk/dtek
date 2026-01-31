const SVITLO_API_URL = "https://api.svitlobot.in.ua/website/getChannelsForMap";

export const fetchSvitlobotOutageData = async () => {
  const response = await fetch(SVITLO_API_URL, {
    signal: AbortSignal.timeout(1000),
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "*/*",
      "accept-language": "en,uk;q=0.9",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      dnt: "1",
      origin: "https://svitlobot.in.ua",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://svitlobot.in.ua/",
      "sec-ch-ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    },
  });

  console.log("Svitlobot API response status:", response.status, response.statusText);

  if (!response.ok) {
    throw new Error(`Svitlobot API HTTP error ${response.status}`);
  }

  const text = await response.text();

  return text;
};
