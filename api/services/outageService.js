import { withRetry } from '../utils/httpClient.js';
import { getCurrentDateKyiv } from '../utils/dateUtils.js';
import { parsePowerResponse, getPowerCityStats } from '../utils/powerUtils.js';
import { formatOutageMessage } from '../utils/messageFormatter.js';
import { getHouseDataFromResponse } from '../helpers.js';
import { fetchDTEKCurrentInfo, fetchPowerInfo } from '../request.js';
import { CONFIG } from '../config.js';

export async function fetchOutageData() {
  console.log('Outage data fetch started');

  const currentDate = getCurrentDateKyiv();
  console.log('Current Kyiv date:', currentDate);

  const [scheduleData, powerResponse] = await Promise.all([
    withRetry(() => fetchDTEKCurrentInfo(currentDate), 10, 'fetchDTEKCurrentInfo'),
    withRetry(() => fetchPowerInfo(), 10, 'fetchPowerInfo')
  ]);

  const entries = parsePowerResponse(powerResponse);

  const powerStats = getPowerCityStats(process.env.POWER_CITY, entries);

  console.log('Power statistics computed:', JSON.stringify(powerStats, null, 2));

  const houseData = getHouseDataFromResponse(scheduleData, process.env.DTEK_HOUSE);

  console.log('House data retrieved:', JSON.stringify(houseData, null, 2));

  return { dtekResponse: scheduleData, houseData, powerStats, currentDate };
}

export function getTodayImageURL() {
  return `${CONFIG.TODAY_IMAGE_URL}?v=${Date.now()}`;
}
