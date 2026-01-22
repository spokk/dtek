export {
  getCurrentDateKyiv,
  calculateTimeDifference,
  toKyivDayMonth
} from './utils/dateUtils.js';
export {
  checkImageExists,
  withRetry
} from './utils/httpClient.js';
export {
  formatScheduleText,
  formatDTEKMessage
} from './utils/messageFormatter.js';

import { fetchDTEKCurrentInfo } from './request.js';

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

export const fetchDTEKData = async (currentDate) => {
  const res = await fetchDTEKCurrentInfo(currentDate);

  console.log('DTEK API response status:', res.status, res.statusText);

  if (!res.ok) {
    throw new Error(`DTEK API returned error: ${res.status}`);
  }

  const text = await res.text();

  return JSON.parse(text);
};