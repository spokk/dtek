import { withRetry } from "../utils/httpClient.js";
import { getCurrentDateKyiv } from "../utils/dateUtils.js";
import { parsePowerResponse, getPowerCitiesStats } from "../utils/powerUtils.js";

import { getHouseDataFromResponse } from "../helpers.js";
import { fetchDTEKCurrentInfo, fetchPowerInfo } from "../request.js";

const RETRY_LIMITS = {
  DTEK: 10,
  SVITLOBOT: 3,
};

async function fetchDataSources(currentDate) {
  const [dtekResult, powerInfoResult] = await Promise.allSettled([
    withRetry(() => fetchDTEKCurrentInfo(currentDate), RETRY_LIMITS.DTEK, "fetchDTEKCurrentInfo"),
    withRetry(fetchPowerInfo, RETRY_LIMITS.SVITLOBOT, "fetchPowerInfo"),
  ]);

  validateDTEKResult(dtekResult);

  return {
    dtekResponse: dtekResult.value,
    powerEntries: extractPowerEntries(powerInfoResult),
  };
}

function validateDTEKResult(result) {
  if (result.status !== "fulfilled") {
    console.error("[fetchOutageData] DTEK fetch failed:", result.reason);
    throw result.reason;
  }
}

function extractPowerEntries(result) {
  if (result.status === "fulfilled") {
    return parsePowerResponse(result.value);
  }

  console.warn("[fetchOutageData] PowerInfo unavailable:", result.reason?.message);
  return [];
}

function parseCitiesFromEnv() {
  const citiesEnv = process.env.POWER_CITIES ?? "";

  return citiesEnv
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);
}

export async function fetchOutageData() {
  console.log("[fetchOutageData] Started");

  const currentDate = getCurrentDateKyiv();
  console.log("[fetchOutageData] Current Kyiv date:", currentDate);

  const { dtekResponse, powerEntries } = await fetchDataSources(currentDate);

  const cities = parseCitiesFromEnv();
  const powerStats = getPowerCitiesStats(cities, powerEntries);
  console.log("[fetchOutageData] Power statistics:", JSON.stringify(powerStats, null, 2));

  const houseData = getHouseDataFromResponse(dtekResponse, process.env.DTEK_HOUSE);
  console.log("[fetchOutageData] House data:", JSON.stringify(houseData, null, 2));

  return {
    dtekResponse,
    houseData,
    powerStats,
    currentDate,
  };
}
