import { buildScheduleBlocks } from "./formatters/scheduleFormatter.js";
import { formatNoOutageMessage, formatActiveOutageMessage } from "./formatters/outageFormatter.js";
import { getHouseGroup, hasOutagePeriod } from "../utils/helpers.js";

const buildSchedule = (scheduleData) => {
  if (!scheduleData) return [];

  const { todayUNIX, tomorrowUNIX, hoursDataToday, hoursDataTomorrow, preset } = scheduleData;
  return buildScheduleBlocks(todayUNIX, tomorrowUNIX, hoursDataToday, hoursDataTomorrow, preset);
};

const extractMessageData = (outageData) => {
  const { houseData, scheduleData, powerStats, currentDate } = outageData;
  const { updateTimestamp } = outageData.dtekResponse;

  const houseGroup = getHouseGroup(houseData, scheduleData?.preset);
  const scheduleBlocks = buildSchedule(scheduleData);

  return {
    houseGroup,
    house: houseData,
    currentDate,
    scheduleBlocks,
    powerStats,
    updateTimestamp,
  };
};

export const formatOutageMessage = (outageData) => {
  const messageData = extractMessageData(outageData);

  if (hasOutagePeriod(outageData?.houseData)) {
    return formatActiveOutageMessage(messageData);
  }

  return formatNoOutageMessage(messageData);
};
