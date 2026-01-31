import { withRetry } from "../utils/httpClient.js";
import { getCurrentDateKyiv } from "../utils/dateUtils.js";
import {
  parsePowerResponse,
  getPowerCitiesStats,
} from "../utils/powerUtils.js";
import { getHouseDataFromResponse } from "../helpers.js";
import { fetchDTEKCurrentInfo, fetchPowerInfo } from "../request.js";
import { CONFIG } from "../config.js";

export async function fetchOutageData() {
  console.log("[fetchOutageData] Started");

  const currentDate = getCurrentDateKyiv();
  console.log("[fetchOutageData] Current Kyiv date:", currentDate);

  const [dtekResult, powerInfoResult] = await Promise.allSettled([
    withRetry(
      () => fetchDTEKCurrentInfo(currentDate),
      10,
      "fetchDTEKCurrentInfo",
    ),
    withRetry(fetchPowerInfo, 3, "fetchPowerInfo"),
  ]);

  // ❗ DTEK — критичний
  if (dtekResult.status !== "fulfilled") {
    console.error("[fetchOutageData] DTEK fetch failed:", dtekResult.reason);
    throw dtekResult.reason;
  }

  const dtekResponse = dtekResult.value;

  // ⚠️ PowerInfo — опціональний
  const powerEntries =
    powerInfoResult.status === "fulfilled"
      ? parsePowerResponse(powerInfoResult.value)
      : [];

  if (powerInfoResult.status !== "fulfilled") {
    console.warn(
      "[fetchOutageData] PowerInfo unavailable:",
      powerInfoResult.reason?.message,
    );
  }

  const cities = (process.env.POWER_CITIES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const powerStats = getPowerCitiesStats(cities, powerEntries);
  console.log(
    "[fetchOutageData] Power statistics:",
    JSON.stringify(powerStats, null, 2),
  );

  const houseData = getHouseDataFromResponse(
    dtekResponse,
    process.env.DTEK_HOUSE,
  );

  console.log(
    "[fetchOutageData] House data:",
    JSON.stringify(houseData, null, 2),
  );

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
