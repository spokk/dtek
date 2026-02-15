import type { PowerRow } from "../types.js";
import { parsePowerRow } from "../utils/powerUtils.js";

const SVITLO_API_URL = "https://api.svitlobot.in.ua/website/getChannelsForMap";

export const fetchSvitlobotOutageData = async (): Promise<PowerRow[]> => {
  const response = await fetch(SVITLO_API_URL, {
    signal: AbortSignal.timeout(1000),
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "*/*",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      origin: "https://svitlobot.in.ua",
      referer: "https://svitlobot.in.ua/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    },
  });

  console.log("Svitlobot API response status:", response.status, response.statusText);

  if (!response.ok) {
    throw new Error(`Svitlobot API HTTP error ${response.status}`);
  }

  const text = await response.text();

  return text
    .trim()
    .split("\n")
    .map(parsePowerRow)
    .filter((row): row is PowerRow => Boolean(row));
};
