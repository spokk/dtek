import { config } from "../config.js";

const DTEK_API_URL = "https://www.dtek-krem.com.ua/ua/ajax";
const DTEK_API_METHOD = "getHomeNum";
const DTEK_API_HEADERS = {
  accept: "application/json, text/javascript, */*; q=0.01",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "x-requested-with": "XMLHttpRequest",
  Referer: "https://www.dtek-krem.com.ua/ua/shutdowns",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
};

export const fetchDTEKOutageData = async (currentDate) => {
  const response = await fetch(DTEK_API_URL, {
    signal: AbortSignal.timeout(2000),
    method: "POST",
    cache: "no-store",
    headers: {
      ...DTEK_API_HEADERS,
      "x-csrf-token": config.dtek.csrfToken,
      Cookie: config.dtek.cookie,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    body: new URLSearchParams({
      method: DTEK_API_METHOD,
      "data[0][name]": "city",
      "data[0][value]": config.dtek.city,
      "data[1][name]": "street",
      "data[1][value]": config.dtek.street,
      "data[2][name]": "updateFact",
      "data[2][value]": currentDate,
    }),
  });

  console.log("DTEK API response status:", response.status, response.statusText);

  if (!response.ok) {
    throw new Error(`DTEK API returned error: ${response.status}`);
  }

  const text = await response.text();

  return JSON.parse(text);
};
