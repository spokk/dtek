import { fetchDTEKOutageData } from "../infrastructure/dtekApi.js";
import { fetchSvitlobotOutageData } from "../infrastructure/svitlobotApi.js";
import { withRetry } from "../utils/httpClient.js";
import { getCurrentUADateTime, addNextDay } from "../utils/dateUtils.js";
import { getRegionalPowerStats } from "../utils/powerUtils.js";
import { getHouseDataFromResponse, extractTodayUNIX, getHoursData } from "../utils/helpers.js";
import { config } from "../config.js";

const RETRY_LIMITS = {
  DTEK: 10,
  SVITLOBOT: 3,
};

async function fetchDTEK(currentDate) {
  const result = await withRetry(
    () => fetchDTEKOutageData(currentDate, config.dtek),
    RETRY_LIMITS.DTEK,
    "Fetching DTEK Outage Data.",
  );

  if (!result) {
    throw new Error("DTEK data unavailable");
  }

  return result;
}

async function fetchSvitlobot() {
  try {
    const result = await withRetry(
      fetchSvitlobotOutageData,
      RETRY_LIMITS.SVITLOBOT,
      "Fetch Svitlobot Outage Data.",
    );

    return result ?? [];
  } catch (error) {
    console.warn("Svitlobot data unavailable:", error.message);
    return [];
  }
}

async function fetchAllOutageSources(currentDate) {
  const [dtekResult, svitlobotResult] = await Promise.allSettled([
    fetchDTEK(currentDate),
    fetchSvitlobot(),
  ]);

  if (dtekResult.status !== "fulfilled") {
    console.error("DTEK data unavailable:", dtekResult.reason);
    throw dtekResult.reason;
  }

  const svitlobotData = svitlobotResult.status === "fulfilled" ? svitlobotResult.value : [];

  return {
    dtekData: dtekResult.value,
    svitlobotData,
  };
}

function buildOutageResponse(dtekResponse, svitlobotData, currentDate) {
  const houseData = getHouseDataFromResponse(dtekResponse, config.dtek.house);

  return {
    dtekResponse,
    houseData,
    scheduleData: extractScheduleData(dtekResponse, houseData),
    powerStats: getRegionalPowerStats(svitlobotData, config.power),
    currentDate,
  };
}

export async function getOutageData() {
  const currentDate = getCurrentUADateTime();

  const { dtekData, svitlobotData } = await fetchAllOutageSources(currentDate);

  return buildOutageResponse(dtekData, svitlobotData, currentDate);
}

export function extractScheduleData(dtekResponse, houseData) {
  const resolvedHouseData = houseData ?? getHouseDataFromResponse(dtekResponse, config.dtek.house);
  const reasonKey = resolvedHouseData?.sub_type_reason?.[0];
  const { fact, preset } = dtekResponse;
  const todayUNIX = extractTodayUNIX(fact);

  if (!todayUNIX || !reasonKey) return null;

  const tomorrowUNIX = addNextDay(todayUNIX);

  return {
    todayUNIX,
    tomorrowUNIX,
    reasonKey,
    preset,
    hoursDataToday: getHoursData(fact, reasonKey, todayUNIX),
    hoursDataTomorrow: getHoursData(fact, reasonKey, tomorrowUNIX),
  };
}
