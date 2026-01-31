import { add24Hours } from "../utils/dateUtils.js";
import { buildScheduleBlocks } from "./formatters/scheduleFormatter.js";
import { formatNoOutageMessage, formatActiveOutageMessage } from "./formatters/outageFormatter.js";
import { extractTodayUNIX, getHouseGroup, getHoursData, hasOutagePeriod } from "../helpers.js";

const buildSchedule = (fact, reasonKey, preset) => {
  const todayUNIX = extractTodayUNIX(fact);

  if (!todayUNIX) {
    console.warn("Invalid or missing fact.today:", fact?.today);
    return [];
  }

  const tomorrowUNIX = add24Hours(todayUNIX);
  const hoursDataToday = getHoursData(fact, reasonKey, todayUNIX);
  const hoursDataTomorrow = getHoursData(fact, reasonKey, tomorrowUNIX);

  return buildScheduleBlocks(todayUNIX, tomorrowUNIX, hoursDataToday, hoursDataTomorrow, preset);
};

const extractMessageData = (dtekResponse, houseData, currentDate, powerStats) => {
  const street = process.env.DTEK_STREET;
  const { updateTimestamp, fact, preset } = dtekResponse;
  const reasonKey = houseData?.sub_type_reason?.[0];
  const houseGroup = getHouseGroup(houseData, preset);
  const scheduleBlocks = buildSchedule(fact, reasonKey, preset);

  return {
    street,
    houseGroup,
    house: houseData,
    currentDate,
    scheduleBlocks,
    powerStats,
    updateTimestamp,
  };
};

export const formatOutageMessage = (dtekResponse = {}, houseData, currentDate, powerStats) => {
  const messageData = extractMessageData(dtekResponse, houseData, currentDate, powerStats);

  if (hasOutagePeriod(houseData)) {
    return formatActiveOutageMessage(messageData);
  }

  return formatNoOutageMessage(messageData);
};
