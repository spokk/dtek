import type { DtekResponse, DtekFact, DtekPreset, HouseData, HoursData } from "../types.js";

export const getHouseDataFromResponse = (
  dtekResponse: DtekResponse | null | undefined,
  houseNumber: string | undefined,
): HouseData | null => {
  const houseData = dtekResponse?.data?.[houseNumber as string] ?? null;

  if (!houseData && dtekResponse?.data) {
    console.error(`DTEK_HOUSE key "${houseNumber}" not found in response data`);
  }

  return houseData;
};

export const extractTodayUNIX = (fact: DtekFact | null | undefined): number | null => {
  const raw = typeof fact?.today === "string" ? parseInt(fact.today, 10) : fact?.today;
  return typeof raw === "number" && Number.isInteger(raw) && raw > 0 ? raw : null;
};

export const getHouseGroup = (
  houseData: HouseData | null | undefined,
  preset: DtekPreset | null | undefined,
): string => {
  const reasonKey = houseData?.sub_type_reason?.[0];

  return (
    preset?.sch_names?.[reasonKey as string] ?? reasonKey?.match(/(\d+\.?\d*)/)?.[1] ?? "Невідомо"
  );
};

export const getHoursData = (
  fact: DtekFact | null | undefined,
  reasonKey: string,
  dayUNIX: number,
): HoursData | undefined => {
  return fact?.data?.[String(dayUNIX)]?.[reasonKey];
};

export const hasOutagePeriod = (houseData: HouseData | null | undefined): boolean => {
  return Boolean(houseData?.sub_type && (houseData?.start_date || houseData?.end_date));
};

export const hasAnyOutage = (hoursData: HoursData | null | undefined): boolean =>
  Object.values(hoursData || {}).some((v) => v !== "yes");
