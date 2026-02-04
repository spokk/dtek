export const getHouseDataFromResponse = (dtekResponse) => {
  const houseNumber = process.env.DTEK_HOUSE;
  return dtekResponse?.data?.[houseNumber] ?? null;
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
