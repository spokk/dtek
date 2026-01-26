import { CONFIG } from './config.js';

export const fetchDTEKCurrentInfo = async (currentDate) => {
  const res = await fetch(CONFIG.DTEK_API_URL, {
    method: "POST",
    cache: 'no-store',
    headers: {
      ...CONFIG.DTEK_API_HEADERS,
      "x-csrf-token": process.env.DTEK_CSRF_TOKEN,
      "Cookie": process.env.DTEK_COOKIE,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    },
    body: new URLSearchParams({
      method: CONFIG.DTEK_API_METHOD,
      "data[0][name]": "city",
      "data[0][value]": process.env.DTEK_CITY,
      "data[1][name]": "street",
      "data[1][value]": process.env.DTEK_STREET,
      "data[2][name]": "updateFact",
      "data[2][value]": currentDate
    })
  });

  return res;
};

export const fetchPowerInfo = async () => {
  const response = await fetch('https://api.svitlobot.in.ua/website/getChannelsForMap', {
    method: 'GET',
    headers: {
      'accept': '*/*',
      'accept-language': 'en,uk;q=0.9',
      'cache-control': 'no-cache',
      'dnt': '1',
      'origin': 'https://svitlobot.in.ua',
      'pragma': 'no-cache',
      'priority': 'u=1, i',
      'referer': 'https://svitlobot.in.ua/',
      'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`fetchPowerInfo HTTP error ${response.status}`);
  }

  const text = await response.text();

  return text;
}
