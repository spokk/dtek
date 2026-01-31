export const CONFIG = {
  // Retry configuration
  RETRY_MAX_ATTEMPTS: 10,

  // DTEK API
  DTEK_API_URL: "https://www.dtek-krem.com.ua/ua/ajax",
  DTEK_API_METHOD: "getHomeNum",
  DTEK_API_HEADERS: {
    accept: "application/json, text/javascript, */*; q=0.01",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "x-requested-with": "XMLHttpRequest",
    "sec-ch-ua": `"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    Referer: "https://www.dtek-krem.com.ua/ua/shutdowns",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  },

  // Image
  TODAY_IMAGE_URL:
    "https://y2.vyshgorod.in.ua/dtek_data/images/kyiv-region/today.png",

  // Svitlo API
  SVITLO_API_URL: "https://api.svitlobot.in.ua/website/getChannelsForMap",

  // Messages
  MESSAGES: {
    NO_INFO:
      "❌ Немає інформації для цієї адреси чи відсутнє планове відключення",
    ERROR: "❌ Сталася помилка при отриманні даних",
  },
};
