import { toUADayMonthFromUnix } from "../../utils/dateUtils.js";
import { hasAnyOutage } from "../../utils/helpers.js";
import type { HoursData, DtekPreset, TimeSegment } from "../../types.js";

const STATUS_ICONS: Record<string, string> = {
  yes: "🟢",
  no: "🔴",
  mfirst: "🟡",
  msecond: "🟡",
};

const createSegment = (from: string, to: string, status: string): TimeSegment => ({
  from,
  to,
  status,
});

const pad = (n: number): string => String(n).padStart(2, "0");

const buildHalfHourSlots = (hoursData: HoursData): TimeSegment[] => {
  const slots: TimeSegment[] = [];

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

const mergeAdjacentSegments = (segments: TimeSegment[]): TimeSegment[] => {
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

const formatSegment = (segment: TimeSegment, timeType: Record<string, string>): string => {
  const icon = STATUS_ICONS[segment.status];
  const label = timeType[segment.status];
  return `${icon} ${segment.from} – ${segment.to} — ${label}`;
};

export const formatScheduleText = (
  hoursData: HoursData | null | undefined,
  timeType: Record<string, string> | undefined,
): string => {
  if (!hoursData || !timeType) return "";

  const slots = buildHalfHourSlots(hoursData);
  const merged = mergeAdjacentSegments(slots);

  return merged.map((s) => formatSegment(s, timeType)).join("\n");
};

export const buildScheduleBlocks = (
  todayUNIX: number,
  tomorrowUNIX: number,
  hoursDataToday: HoursData | undefined,
  hoursDataTomorrow: HoursData | undefined,
  preset: DtekPreset | undefined,
): string[] => {
  const blocks: string[] = [];

  const todayText = formatScheduleText(hoursDataToday, preset?.time_type);

  blocks.push(`<b>🗓 Графік відключень на ${toUADayMonthFromUnix(todayUNIX)}:</b>\n${todayText}`);

  if (hasAnyOutage(hoursDataTomorrow)) {
    const tomorrowText = formatScheduleText(hoursDataTomorrow, preset?.time_type);

    blocks.push(
      `<b>🗓 Графік відключень на ${toUADayMonthFromUnix(tomorrowUNIX)}:</b>\n${tomorrowText}`,
    );
  }

  return blocks;
};
