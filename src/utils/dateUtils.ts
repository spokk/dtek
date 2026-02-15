import { DateTime } from "luxon";

const KYIV_TZ = "Europe/Kyiv";
const UA_LOCALE = "uk-UA";

export const parseUaDateTimeSafe = (dateStr: string): Date | null => {
  if (typeof dateStr !== "string" || !dateStr.trim()) return null;

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 2) return null;

  const [a, b] = parts;
  const isDateFirst = a.includes(".");

  const datePart = isDateFirst ? a : b;
  const timePart = isDateFirst ? b : a;

  const kyivDateTime = DateTime.fromFormat(`${datePart} ${timePart}`, "dd.MM.yyyy HH:mm", {
    zone: KYIV_TZ,
    locale: UA_LOCALE,
  });

  if (!kyivDateTime.isValid) return null;

  return kyivDateTime.toJSDate();
};

export const formatTimeDifference = (diffMs: number): string | null => {
  if (diffMs <= 0) return null;

  const duration = DateTime.fromMillis(0)
    .plus({ milliseconds: diffMs })
    .diff(DateTime.fromMillis(0));

  const days = Math.floor(duration.as("days"));
  const hours = Math.floor(duration.as("hours") % 24);
  const minutes = Math.floor(duration.as("minutes") % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} дн`);
  if (hours > 0 || days > 0) parts.push(`${hours} год`);
  parts.push(`${minutes} хв`);

  return parts.join(" ");
};

export const calculateTimeDifference = (from: string, to: string): string | null => {
  const d1 = parseUaDateTimeSafe(from);
  if (!d1) return null;

  const d2 = parseUaDateTimeSafe(to);
  if (!d2) return null;

  const dt1 = DateTime.fromJSDate(d1);
  const dt2 = DateTime.fromJSDate(d2);
  const diffMs = dt2.diff(dt1).as("milliseconds");

  if (diffMs < 0) return null;

  return formatTimeDifference(diffMs);
};

export function addNextDay(unixSeconds: number): number {
  return DateTime.fromSeconds(unixSeconds).plus({ days: 1 }).toSeconds();
}

export const getCurrentUADateTime = (): string => {
  return DateTime.now().setZone(KYIV_TZ).toFormat("HH:mm dd.MM.yyyy");
};

export const toUADayMonthFromUnix = (unixSeconds: number): string => {
  return DateTime.fromSeconds(unixSeconds).setZone(KYIV_TZ).setLocale(UA_LOCALE).toFormat("d MMMM");
};

export const formatUATime = (date: Date): string => {
  return DateTime.fromJSDate(date).setZone(KYIV_TZ).setLocale(UA_LOCALE).toFormat("HH:mm");
};

export const formatUADate = (date: Date): string => {
  return DateTime.fromJSDate(date).setZone(KYIV_TZ).setLocale(UA_LOCALE).toFormat("d MMMM");
};
