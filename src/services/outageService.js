import { fetchDTEKOutageData } from "../infrastructure/dtekApi.js";
import { fetchSvitlobotOutageData } from "../infrastructure/svitlobotApi.js";

import { withRetry } from "../utils/httpClient.js";
import { getCurrentDateKyiv } from "../utils/dateUtils.js";
import { getPowerCitiesStats, parsePowerRow } from "../utils/powerUtils.js";

import { getHouseDataFromResponse } from "../helpers.js";

const RETRY_LIMITS = {
  DTEK: 10,
  SVITLOBOT: 3,
};

async function fetchDataSources(currentDate) {
  const [dtekResult, svitloBotResult] = await Promise.allSettled([
    withRetry(() => fetchDTEKOutageData(currentDate), RETRY_LIMITS.DTEK, "fetchDTEKOutageData"),
    withRetry(fetchSvitlobotOutageData, RETRY_LIMITS.SVITLOBOT, "fetchSvitlobotOutageData"),
  ]);

  validateDTEKResult(dtekResult);

  return {
    dtekResponse: dtekResult.value,
    svitlobotResponse: extractSvitlobotEntries(svitloBotResult),
  };
}

function validateDTEKResult(result) {
  if (result.status !== "fulfilled") {
    console.error("DTEK data unavailable:", result.reason);
    throw result.reason;
  }
}

function extractSvitlobotEntries(result) {
  if (result.status === "fulfilled" && typeof result.value === "string") {
    return result.value.trim().split("\n").map(parsePowerRow).filter(Boolean);
  }

  console.warn("Svitlobot data unavailable:", result.reason?.message);
  return [];
}

function getCityNamesFromEnv() {
  const citiesEnv = process.env.POWER_CITIES ?? "";

  return citiesEnv
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);
}

export async function getOutageData() {
  const currentDate = getCurrentDateKyiv();

  const { dtekResponse, svitlobotResponse } = await fetchDataSources(currentDate);

  const cityNames = getCityNamesFromEnv();

  const powerStats = getPowerCitiesStats(cityNames, svitlobotResponse);

  const houseData = getHouseDataFromResponse(dtekResponse, process.env.DTEK_HOUSE);

  return {
    dtekResponse,
    houseData,
    powerStats,
    currentDate,
  };
}
