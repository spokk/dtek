import { fetchDTEKCurrentInfo } from './request.js';

export const getHouseDataFromResponse = (json, houseNumber) => {
  if (!json?.data) {
    console.error('API Response structure:', JSON.stringify(json, null, 2));
    throw new Error(`Invalid API response: missing data field. Response keys: ${json ? Object.keys(json).join(', ') : 'null'}`);
  }

  const house = json.data[houseNumber];

  if (!house) {
    return null;
  }

  return house;
};

export const fetchDTEKData = async (currentDate) => {
  const res = await fetchDTEKCurrentInfo(currentDate);

  console.log('DTEK API response status:', res.status, res.statusText);

  if (!res.ok) {
    throw new Error(`DTEK API returned error: ${res.status}`);
  }

  const text = await res.text();

  return JSON.parse(text);
};

export const extractTodayUNIX = (fact) => {
  let todayUNIX = fact?.today;
  if (typeof todayUNIX === 'string') {
    todayUNIX = parseInt(todayUNIX, 10);
  }
  return Number.isInteger(todayUNIX) && todayUNIX > 0 ? todayUNIX : null;
};

export const getHouseGroup = (houseData, preset) => {
  const reasonKey = houseData?.sub_type_reason?.[0];
  return preset?.sch_names?.[reasonKey] || reasonKey?.slice(-3) || 'Невідомо';
};

export const getHoursData = (fact, reasonKey, dayUNIX) => {
  return fact?.data?.[dayUNIX]?.[reasonKey];
};

export const hasOutagePeriod = (houseData) => {
  return houseData?.sub_type && (houseData?.start_date || houseData?.end_date);
};