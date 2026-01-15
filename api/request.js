import { CONFIG } from './config.js';

export const fetchDTEKCurrentInfo = async (currentDate) => {
  const res = await fetch(CONFIG.DTEK_API_URL, {
    method: "POST",
    headers: {
      ...CONFIG.DTEK_API_HEADERS,
      "x-csrf-token": process.env.DTEK_CSRF_TOKEN,
      "Cookie": process.env.DTEK_COOKIE
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
