import { buildScheduleBlocks } from "./formatters/scheduleFormatter.js";
import { formatNoOutageMessage, formatActiveOutageMessage } from "./formatters/outageFormatter.js";
import { getHouseGroup, hasOutagePeriod } from "../utils/helpers.js";
import type { OutageData, ScheduleData, MessageData } from "../types.js";

const buildSchedule = (scheduleData: ScheduleData | null): string[] => {
  if (!scheduleData) return [];

  const { todayUNIX, tomorrowUNIX, hoursDataToday, hoursDataTomorrow, preset } = scheduleData;
  return buildScheduleBlocks(todayUNIX, tomorrowUNIX, hoursDataToday, hoursDataTomorrow, preset);
};

const extractMessageData = (outageData: OutageData): MessageData => {
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

export const formatOutageMessage = (outageData: OutageData): string => {
  const messageData = extractMessageData(outageData);

  if (hasOutagePeriod(outageData?.houseData)) {
    return formatActiveOutageMessage(messageData);
  }

  return formatNoOutageMessage(messageData);
};
