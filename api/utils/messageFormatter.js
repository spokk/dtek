import {
  extractTodayUNIX,
  getHouseGroup,
  getHoursData,
  hasOutagePeriod,
} from "../helpers.js";

import {
  add24Hours,
  calculateTimeDifference,
  toKyivDayMonth,
} from "./dateUtils.js";

export const formatScheduleText = (hoursData, timeZone, timeType) => {
  if (!hoursData || !timeZone || !timeType) return "";

  const segments = [];

  const STATUS_ICON = {
    yes: "🟢",
    no: "🔴",
    first: "🔴",
    second: "🟢",
    mfirst: "🟡",
    msecond: "🟡",
  };

  const addSegment = (from, to, status) => {
    if (!from || !to || !status) return;
    segments.push({ from, to, status });
  };

  Object.keys(hoursData)
    .sort((a, b) => a - b)
    .forEach((h) => {
      const status = hoursData[h];
      const [, start, end] = timeZone[h];

      if (status === "first") {
        addSegment(start, start.replace(":00", ":30"), "no");
        addSegment(start.replace(":00", ":30"), end, "yes");
      } else if (status === "second") {
        addSegment(start, start.replace(":00", ":30"), "yes");
        addSegment(start.replace(":00", ":30"), end, "no");
      } else {
        addSegment(start, end, status);
      }
    });

  // Merge adjacent segments with same status
  const merged = [];
  for (const s of segments) {
    const last = merged[merged.length - 1];
    if (last && last.status === s.status && last.to === s.from) {
      last.to = s.to;
    } else {
      merged.push({ ...s });
    }
  }

  return merged
    .map((s) => {
      const icon = STATUS_ICON[s.status] ?? "🟡";
      return `${icon} ${s.from} – ${s.to} — ${timeType[s.status]}`;
    })
    .join("\n");
};

const buildScheduleBlocks = (
  todayUNIX,
  tomorrowUNIX,
  hoursDataToday,
  hoursDataTomorrow,
  preset,
) => {
  const scheduleToday = formatScheduleText(
    hoursDataToday,
    preset?.time_zone,
    preset?.time_type,
  );

  const scheduleTomorrow = formatScheduleText(
    hoursDataTomorrow,
    preset?.time_zone,
    preset?.time_type,
  );

  const blocks = [
    `<b>🗓 Графік відключень на ${toKyivDayMonth(todayUNIX)}:</b>\n${scheduleToday}`,
  ];

  // Determine if tomorrow has any outage (any segment not "yes")
  const hasOutageTomorrow =
    hoursDataTomorrow &&
    Object.values(hoursDataTomorrow).some((status) => status !== "yes");

  if (hasOutageTomorrow) {
    blocks.push(
      `<b>🗓 Графік відключень на ${toKyivDayMonth(tomorrowUNIX)}:</b>\n${scheduleTomorrow}`,
    );
  }

  return blocks;
};
const buildNoOutageMessage = (
  street,
  houseGroup,
  scheduleBlocks,
  powerStats,
  updateTimestamp,
) => {
  const messageParts = [
    `⚡️ <b>Статус електропостачання: 📍${street} | ${houseGroup}</b>`,
    `⚠️ Якщо в даний момент у вас відсутнє світло, імовірно виникла аварійна ситуація, або діють стабілізаційні або екстрені відключення.`,
    ...scheduleBlocks,
    ...(powerStats ? [powerStats] : []),
    `🕒 Оновлено: <i>${updateTimestamp}</i>`,
  ];

  return messageParts.join("\n\n");
};

const buildOutageMessage = (
  street,
  houseGroup,
  house,
  currentDate,
  scheduleBlocks,
  powerStats,
  updateTimestamp,
) => {
  const timeSince =
    calculateTimeDifference(house.start_date, currentDate) || "Невідомо";
  const timeUntil =
    calculateTimeDifference(house.end_date, currentDate) || "Невідомо";

  const messageParts = [
    `🚨 <b>Відключення електропостачання: 📍${street} | ${houseGroup}</b>`,
    `❗️ <b>Тип відключення:</b> ${house.sub_type}`,
    `🪫 <b>Вимкнення:</b> ${house.start_date}\n🔋 <b>Відновлення:</b> ${house.end_date}`,
    `⛔️ <b>Без світла:</b> ${timeSince}\n🔌 <b>До відновлення:</b> ${timeUntil}`,
    ...scheduleBlocks,
    ...(powerStats ? [powerStats] : []),
    `🕒 Оновлено: <i>${updateTimestamp}</i>`,
  ];

  return messageParts.join("\n\n");
};

export const formatOutageMessage = (
  dtekResponse = {},
  houseData,
  currentDate,
  powerStats,
) => {
  const street = process.env.DTEK_STREET;
  const { updateTimestamp, fact, preset } = dtekResponse;
  const reasonKey = houseData?.sub_type_reason?.[0];
  const houseGroup = getHouseGroup(houseData, preset);

  const todayUNIX = extractTodayUNIX(fact);

  // Handle invalid or missing date
  if (!todayUNIX) {
    console.warn("Invalid or missing fact.today:", fact?.today);
    const outageExists = hasOutagePeriod(houseData);
    const scheduleBlocks = [];

    if (!outageExists) {
      return buildNoOutageMessage(
        street,
        houseGroup,
        scheduleBlocks,
        powerStats,
        updateTimestamp,
      );
    }
    return buildOutageMessage(
      street,
      houseGroup,
      houseData,
      currentDate,
      scheduleBlocks,
      powerStats,
      updateTimestamp,
    );
  }

  // Build schedule with valid dates
  const tomorrowUNIX = add24Hours(todayUNIX);
  const hoursDataToday = getHoursData(fact, reasonKey, todayUNIX);
  const hoursDataTomorrow = getHoursData(fact, reasonKey, tomorrowUNIX);

  const scheduleBlocks = buildScheduleBlocks(
    todayUNIX,
    tomorrowUNIX,
    hoursDataToday,
    hoursDataTomorrow,
    preset,
  );

  // Return appropriate message based on outage period
  if (!hasOutagePeriod(houseData)) {
    return buildNoOutageMessage(
      street,
      houseGroup,
      scheduleBlocks,
      powerStats,
      updateTimestamp,
    );
  }

  return buildOutageMessage(
    street,
    houseGroup,
    houseData,
    currentDate,
    scheduleBlocks,
    powerStats,
    updateTimestamp,
  );
};
