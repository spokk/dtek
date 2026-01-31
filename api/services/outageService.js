import { withRetry } from "../utils/httpClient.js";
import { getCurrentDateKyiv } from "../utils/dateUtils.js";
import { parsePowerResponse, getPowerCitiesStats } from "../utils/powerUtils.js";
import { getHouseDataFromResponse } from "../helpers.js";
import { fetchDTEKCurrentInfo, fetchPowerInfo } from "../request.js";
import { CONFIG } from "../config.js";

async function fetchDataSources(currentDate) {
  const [dtekResult, powerInfoResult] = await Promise.allSettled([
    withRetry(() => fetchDTEKCurrentInfo(currentDate), 10, "fetchDTEKCurrentInfo"),
    withRetry(fetchPowerInfo, 3, "fetchPowerInfo"),
  ]);

  if (dtekResult.status !== "fulfilled") {
    console.error("[fetchOutageData] DTEK fetch failed:", dtekResult.reason);
    throw dtekResult.reason;
  }

  const powerEntries = handlePowerInfoResult(powerInfoResult);

  return {
    dtekResponse: dtekResult.value,
    powerEntries,
  };
}

function handlePowerInfoResult(result) {
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

export function getTodayImageURL() {
  return `${CONFIG.TODAY_IMAGE_URL}?v=${Date.now()}`;
}
