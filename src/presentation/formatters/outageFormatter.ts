import {
  calculateTimeDifference,
  parseUaDateTimeSafe,
  formatUATime,
  formatUADate,
} from "../../utils/dateUtils.js";
import { escapeHtml } from "../../utils/escapeHtml.js";
import type { MessageData, HouseData, PowerStats } from "../../types.js";

const buildMessageParts = (parts: (string | null | undefined)[]): string =>
  parts.filter(Boolean).join("\n\n");

const formatPowerStats = (powerStats: PowerStats | null): string | null => {
  if (!powerStats) return null;
  return `<b>📊 ${escapeHtml(powerStats.region)}:</b> ${powerStats.lightPercent}% з електропостачанням`;
};

function formatPowerOutagePeriod(startInput: string, endInput: string): string {
  const start = parseUaDateTimeSafe(startInput);
  const end = parseUaDateTimeSafe(endInput);

  const shouldShowMessageAsIs = !start || !end;

  if (shouldShowMessageAsIs) {
    return (
      `🪫 <b>Вимкнення:</b> ${escapeHtml(startInput)}\n` +
      `🔋 <b>Відновлення:</b> ${escapeHtml(endInput)}`
    );
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return (
      `🪫 <b>Вимкнення:</b> ${formatUATime(start)}\n` +
      `🔋 <b>Відновлення:</b> ${formatUATime(end)}`
    );
  }

  return (
    `🪫 <b>Вимкнення:</b> ${formatUATime(start)} ${formatUADate(start)}\n` +
    `🔋 <b>Відновлення:</b> ${formatUATime(end)} ${formatUADate(end)}`
  );
}

const formatOutageDetails = (house: HouseData, currentDate: string): string[] => {
  const timeSince = calculateTimeDifference(house.start_date!, currentDate) || "Невідомо";
  const timeUntil = calculateTimeDifference(currentDate, house.end_date!) || "Невідомо";
  const powerOutagePeriod = formatPowerOutagePeriod(house.start_date!, house.end_date!);

  return [
    `❗️ <b>Тип:</b> ${escapeHtml(house.sub_type!)}`,
    `${powerOutagePeriod}`,
    `⛔️ <b>Без світла:</b> ${escapeHtml(timeSince)}\n🔌 <b>До відновлення:</b> ${escapeHtml(timeUntil)}`,
  ];
};

export const formatNoOutageMessage = (data: MessageData): string => {
  const { houseGroup, scheduleBlocks, powerStats, updateTimestamp } = data;

  const parts = [
    `⚡️ <b>${escapeHtml(houseGroup)} | Відключень не зафіксовано.</b>`,
    `⚠️ Якщо в даний момент у вас відсутнє світло, імовірно виникла аварійна ситуація, або діють стабілізаційні або екстрені відключення.`,
    ...scheduleBlocks,
    formatPowerStats(powerStats),
    `🕒 Оновлено: <i>${escapeHtml(updateTimestamp!)}</i>`,
  ];

  return buildMessageParts(parts);
};

export const formatActiveOutageMessage = (data: MessageData): string => {
  const { houseGroup, house, currentDate, scheduleBlocks, powerStats, updateTimestamp } = data;

  const parts = [
    `🚨 <b>${escapeHtml(houseGroup)} | Відключення.</b>`,
    ...formatOutageDetails(house!, currentDate),
    ...scheduleBlocks,
    formatPowerStats(powerStats),
    `🕒 Оновлено: <i>${escapeHtml(updateTimestamp!)}</i>`,
  ];

  return buildMessageParts(parts);
};
