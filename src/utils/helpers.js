import { config } from "../config.js";

export const getHouseDataFromResponse = (dtekResponse) => {
  const houseNumber = config.dtek.house;
  const houseData = dtekResponse?.data?.[houseNumber] ?? null;

  if (!houseData && dtekResponse?.data) {
    console.error(`DTEK_HOUSE key "${houseNumber}" not found in response data`);
  }

  return houseData;
};

export const extractTodayUNIX = (fact) => {
  const todayUNIX = typeof fact?.today === "string" ? parseInt(fact.today, 10) : fact?.today;

  return Number.isInteger(todayUNIX) && todayUNIX > 0 ? todayUNIX : null;
};

export const getHouseGroup = (houseData, preset) => {
  const reasonKey = houseData?.sub_type_reason?.[0];

  return preset?.sch_names?.[reasonKey] ?? reasonKey?.match(/(\d+\.?\d*)/)?.[1] ?? "Невідомо";
};

export const getHoursData = (fact, reasonKey, dayUNIX) => {
  return fact?.data?.[dayUNIX]?.[reasonKey];
};

export const hasOutagePeriod = (houseData) => {
  return Boolean(houseData?.sub_type && (houseData?.start_date || houseData?.end_date));
};

export const hasAnyOutage = (hoursData) => Object.values(hoursData || {}).some((v) => v !== "yes");
