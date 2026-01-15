import { CONFIG } from './config.js';

export const getHouseDataFromResponse = (json, houseId) => {
  if (!json?.data) {
    console.error('API Response structure:', JSON.stringify(json, null, 2));
    throw new Error(`Invalid API response: missing data field. Response keys: ${json ? Object.keys(json).join(', ') : 'null'}`);
  }

  const house = json.data[houseId];
  if (!house) {
    return null;
  }

  return house;
};


export const getCurrentDateKyiv = () => {
  return new Date().toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '');
};

const parseKyivDateString = (dateStr) => {
  if (typeof dateStr !== 'string' || !dateStr.trim()) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }

  const [part1, part2] = dateStr.split(' ');
  if (!part1 || !part2) {
    throw new Error(`Invalid date format: expected "DD.MM.YYYY HH:MM" or "HH:MM DD.MM.YYYY", got "${dateStr}"`);
  }

  // Determine format: if part1 contains dots, it's a date; if it contains colons, it's time
  const isDateFirst = part1.includes('.');
  const [datePart, timePart] = isDateFirst ? [part1, part2] : [part2, part1];

  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes) || isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error(`Invalid date values: "${dateStr}"`);
  }

  return new Date(year, month - 1, day, hours, minutes);
};

const formatTimeDifference = (diffMs) => {
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

  const timeParts = [diffDays > 0 && `${diffDays} дн`, `${diffHours} год`, `${diffMinutes} хв`].filter(Boolean);
  return timeParts.join(' ');
};

export const timeUntilKyivDate = (dateStr) => {
  const targetDate = parseKyivDateString(dateStr);
  const nowKyiv = parseKyivDateString(getCurrentDateKyiv());
  const diffMs = targetDate - nowKyiv;

  return diffMs <= 0 ? null : formatTimeDifference(diffMs);
};

const timeSincePowerLoss = (dateStr) => {
  const startDate = parseKyivDateString(dateStr);
  const nowKyiv = parseKyivDateString(getCurrentDateKyiv());
  const diffMs = nowKyiv - startDate;

  return diffMs <= 0 ? null : formatTimeDifference(diffMs);
};

// API Configuration
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

export const withRetry = async (fn, maxRetries = CONFIG.RETRY_MAX_ATTEMPTS) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}`);
      return await fn();
    } catch (error) {
      console.error(`Error on attempt ${attempt}:`, error.message);
      if (attempt === maxRetries) throw error;
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1.6s, 3s (capped)
      const delayMs = Math.min(100 * Math.pow(2, attempt - 1), 3000);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

export const fetchDTEKData = async (currentDate) => {
  const res = await fetchDTEKCurrentInfo(currentDate);
  console.log('DTEK API response status:', res.status, res.statusText);

  if (!res.ok) {
    throw new Error(`DTEK API returned error: ${res.status}`);
  }

  const text = await res.text();
  console.log('Raw response:', text);

  return JSON.parse(text);
};


export const formatDTEKMessage = (house, street, updateTimestamp) => {
  const houseGroup = house.sub_type_reason[0]?.slice(-3) ?? 'невідомо';

  if (!house?.sub_type || (!house?.start_date && !house?.end_date)) {
    return [
      `Інформація про відключення на ${street} (група ${houseGroup}) відсутня.`,
      `Якщо в даний момент у вас відсутнє світло, імовірно виникла аварійна ситуація, або діють стабілізаційні або екстрені відключення. Просимо перевірити інформацію через 15 хвилин, саме стільки часу потрібно для оновлення даних на сайті.`,
      `Дата оновлення інформації: ${updateTimestamp}`
    ].join('\n\n');
  }

  const timeSince = timeSincePowerLoss(house.start_date) || 'невідомо';
  const timeUntil = timeUntilKyivDate(house.end_date) || 'невідомо';

  return [
    `За адресою ${street} зафіксовано: ${house.sub_type}`,
    `Початок: ${house.start_date}`,
    `Кінець: ${house.end_date}`,
    `Без світла: ${timeSince}`,
    `До відновлення залишилось: ${timeUntil}`
  ].join('\n');
};