import { toUADayMonthFromUnix } from "../../utils/dateUtils.js";

const STATUS_ICONS = {
  yes: "🟢",
  no: "🔴",
  first: "🔴",
  second: "🟢",
  mfirst: "🟡",
  msecond: "🟡",
};

const createSegment = (from, to, status) => ({ from, to, status });

const splitHalfHourSegment = (start, end, status) => {
  const halfHour = start.replace(":00", ":30");

  if (status === "first") {
    return [createSegment(start, halfHour, "no"), createSegment(halfHour, end, "yes")];
  }

  if (status === "second") {
    return [createSegment(start, halfHour, "yes"), createSegment(halfHour, end, "no")];
  }

  return [createSegment(start, end, status)];
};

const buildSegments = (hoursData, timeZone) => {
  const segments = [];

  const sortedHours = Object.keys(hoursData).sort((a, b) => a - b);

  for (const hour of sortedHours) {
    const status = hoursData[hour];
    const [, start, end] = timeZone[hour];

    const hourSegments = splitHalfHourSegment(start, end, status);
    segments.push(...hourSegments);
  }

  return segments;
};

const mergeAdjacentSegments = (segments) => {
  if (segments.length === 0) return [];

  const merged = [{ ...segments[0] }];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const last = merged[merged.length - 1];

    if (last.status === current.status && last.to === current.from) {
      last.to = current.to;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
};

const formatSegment = (segment, timeType) => {
  const icon = STATUS_ICONS[segment.status] ?? "🟡";
  const label = timeType[segment.status];
  return `${icon} ${segment.from} – ${segment.to} — ${label}`;
};

export const formatScheduleText = (hoursData, timeZone, timeType) => {
  if (!hoursData || !timeZone || !timeType) return "";

  const segments = buildSegments(hoursData, timeZone);
  const merged = mergeAdjacentSegments(segments);

  return merged.map((segment) => formatSegment(segment, timeType)).join("\n");
};

const hasAnyOutage = (hoursData) => {
  if (!hoursData) return false;
  return Object.values(hoursData).some((status) => status !== "yes");
};

export const buildScheduleBlocks = (
  todayUNIX,
  tomorrowUNIX,
  hoursDataToday,
  hoursDataTomorrow,
  preset,
) => {
  const scheduleToday = formatScheduleText(hoursDataToday, preset?.time_zone, preset?.time_type);

  const blocks = [
    `<b>🗓 Графік відключень на ${toUADayMonthFromUnix(todayUNIX)}:</b>\n${scheduleToday}`,
  ];

  if (hasAnyOutage(hoursDataTomorrow)) {
    const scheduleTomorrow = formatScheduleText(
      hoursDataTomorrow,
      preset?.time_zone,
      preset?.time_type,
    );

    blocks.push(
      `<b>🗓 Графік відключень на ${toUADayMonthFromUnix(tomorrowUNIX)}:</b>\n${scheduleTomorrow}`,
    );
  }

  return blocks;
};
