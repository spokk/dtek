import { calculateTimeDifference } from "../../utils/dateUtils.js";

const buildMessageParts = (parts) => parts.filter(Boolean).join("\n\n");

export const formatNoOutageMessage = (data) => {
  const { street, houseGroup, scheduleBlocks, powerStats, updateTimestamp } = data;

  const parts = [
    `⚡️ <b>Статус електропостачання: 📍${street} | ${houseGroup}</b>`,
    `⚠️ Якщо в даний момент у вас відсутнє світло, імовірно виникла аварійна ситуація, або діють стабілізаційні або екстрені відключення.`,
    ...scheduleBlocks,
    powerStats,
    `🕒 Оновлено: <i>${updateTimestamp}</i>`,
  ];

  return buildMessageParts(parts);
};

const formatOutageDetails = (house, currentDate) => {
  const timeSince = calculateTimeDifference(house.start_date, currentDate) || "Невідомо";
  const timeUntil = calculateTimeDifference(house.end_date, currentDate) || "Невідомо";

  return [
    `❗️ <b>Тип відключення:</b> ${house.sub_type}`,
    `🪫 <b>Вимкнення:</b> ${house.start_date}\n🔋 <b>Відновлення:</b> ${house.end_date}`,
    `⛔️ <b>Без світла:</b> ${timeSince}\n🔌 <b>До відновлення:</b> ${timeUntil}`,
  ];
};

export const formatActiveOutageMessage = (data) => {
  const { street, houseGroup, house, currentDate, scheduleBlocks, powerStats, updateTimestamp } =
    data;

  const parts = [
    `🚨 <b>Відключення електропостачання: 📍${street} | ${houseGroup}</b>`,
    ...formatOutageDetails(house, currentDate),
    ...scheduleBlocks,
    powerStats,
    `🕒 Оновлено: <i>${updateTimestamp}</i>`,
  ];

  return buildMessageParts(parts);
};
