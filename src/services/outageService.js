import { fetchDTEKOutageData } from "../infrastructure/dtekApi.js";
import { fetchSvitlobotOutageData } from "../infrastructure/svitlobotApi.js";
import { withRetry } from "../utils/httpClient.js";
import { getCurrentUADateTime } from "../utils/dateUtils.js";
import { getRegionalPowerStats, parsePowerRow } from "../utils/powerUtils.js";
import { getHouseDataFromResponse } from "../utils/helpers.js";

const RETRY_LIMITS = {
  DTEK: 10,
  SVITLOBOT: 3,
};

async function fetchDTEK(currentDate) {
  const result = await withRetry(
    () => fetchDTEKOutageData(currentDate),
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

    if (typeof result === "string") {
      return result.trim().split("\n").map(parsePowerRow).filter(Boolean);
    }

    return [];
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
  return {
    dtekResponse,
    houseData: getHouseDataFromResponse(dtekResponse),
    powerStats: getRegionalPowerStats(svitlobotData),
    currentDate,
  };
}

export async function getOutageData() {
  const currentDate = getCurrentUADateTime();

  const { dtekData, svitlobotData } = await fetchAllOutageSources(currentDate);

  return buildOutageResponse(dtekData, svitlobotData, currentDate);
}
