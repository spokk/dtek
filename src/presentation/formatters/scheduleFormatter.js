import { toUADayMonthFromUnix } from "../../utils/dateUtils.js";

const STATUS_ICONS = {
  yes: "🟢",
  no: "🔴",
  mfirst: "🟡",
  msecond: "🟡",
};

const createSegment = (from, to, status) => ({ from, to, status });

const pad = (n) => String(n).padStart(2, "0");

const buildHalfHourSlots = (hoursData) => {
  const slots = [];

  for (let h = 1; h <= 24; h++) {
    const status = hoursData[String(h)];
    const startHour = pad(h - 1);

    const t1 = `${startHour}:00`;
    const t2 = `${startHour}:30`;
    const t3 = `${pad(h)}:00`;

    if (status === "yes") {
      slots.push(createSegment(t1, t3, "yes"));
    } else if (status === "no") {
      slots.push(createSegment(t1, t3, "no"));
    } else if (status === "first") {
      slots.push(createSegment(t1, t2, "no"));
      slots.push(createSegment(t2, t3, "yes"));
    } else if (status === "second") {
      slots.push(createSegment(t1, t2, "yes"));
      slots.push(createSegment(t2, t3, "no"));
    } else if (status === "mfirst") {
      slots.push(createSegment(t1, t3, "mfirst"));
    } else if (status === "msecond") {
      slots.push(createSegment(t1, t3, "msecond"));
    }
  }

  return slots;
};

const mergeAdjacentSegments = (segments) => {
  if (!segments.length) return [];

  const merged = [segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1];
    const current = segments[i];

    if (last.status === current.status && last.to === current.from) {
      last.to = current.to;
    } else {
      merged.push(current);
    }
  }

  return merged;
};

const formatSegment = (segment, timeType) => {
  const icon = STATUS_ICONS[segment.status];
  const label = timeType[segment.status];
  return `${icon} ${segment.from} – ${segment.to} — ${label}`;
};

export const formatScheduleText = (hoursData, _timeZone, timeType) => {
  if (!hoursData || !timeType) return "";

  const slots = buildHalfHourSlots(hoursData);
  const merged = mergeAdjacentSegments(slots);

  return merged.map((s) => formatSegment(s, timeType)).join("\n");
};

const hasAnyOutage = (hoursData) => Object.values(hoursData || {}).some((v) => v !== "yes");

export const buildScheduleBlocks = (
  todayUNIX,
  tomorrowUNIX,
  hoursDataToday,
  hoursDataTomorrow,
  preset,
) => {
  const blocks = [];

  const todayText = formatScheduleText(hoursDataToday, preset?.time_zone, preset?.time_type);

  blocks.push(`<b>🗓 Графік відключень на ${toUADayMonthFromUnix(todayUNIX)}:</b>\n${todayText}`);

  if (hasAnyOutage(hoursDataTomorrow)) {
    const tomorrowText = formatScheduleText(
      hoursDataTomorrow,
      preset?.time_zone,
      preset?.time_type,
    );

    blocks.push(
      `<b>🗓 Графік відключень на ${toUADayMonthFromUnix(tomorrowUNIX)}:</b>\n${tomorrowText}`,
    );
  }

  return blocks;
};
