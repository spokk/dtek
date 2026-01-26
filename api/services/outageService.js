import { withRetry } from '../utils/httpClient.js';
import { getCurrentDateKyiv } from '../utils/dateUtils.js';
import { parsePowerResponse, getPowerCityStats } from '../utils/powerUtils.js';
import { formatOutageMessage } from '../utils/messageFormatter.js';
import { fetchDTEKData, getHouseDataFromResponse } from '../helpers.js';
import { fetchPowerInfo } from '../request.js';
import { CONFIG } from '../config.js';

export async function fetchOutageData() {
  console.log('Outage data fetch started');

  const currentDate = getCurrentDateKyiv();
  console.log('Current Kyiv date:', currentDate);

  const [scheduleData, powerResponse] = await Promise.all([
    withRetry(() => fetchDTEKData(currentDate)),
    withRetry(() => fetchPowerInfo())
  ]);

  console.log('Retrieved DTEK data:', JSON.stringify(scheduleData, null, 2));

  const entries = parsePowerResponse(powerResponse);

  console.log(`Parsed ${entries.length} power entries`, JSON.stringify(entries, null, 2));

  const powerStats = getPowerCityStats(process.env.POWER_CITY, entries);

  console.log('Power statistics computed:', JSON.stringify(powerStats, null, 2));

  const houseData = getHouseDataFromResponse(scheduleData, process.env.DTEK_HOUSE);

  console.log('House data retrieved:', JSON.stringify(houseData, null, 2));

  return { dtekResponse: scheduleData, houseData, powerStats, currentDate };
}

export function formatOutageCaption(dtekResponse, houseData, powerStats, currentDate) {
  return formatOutageMessage(
    dtekResponse,
    houseData,
    process.env.DTEK_STREET,
    currentDate,
    powerStats
  );
}

export function getTodayImageURL() {
  return `${CONFIG.TODAY_IMAGE_URL}?v=${Date.now()}`;
}
