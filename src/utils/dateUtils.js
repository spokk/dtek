import { DateTime } from "luxon";

const KYIV_TZ = "Europe/Kyiv";
const UA_LOCALE = "uk-UA";

// =======================
// Core date parser
// Supports:
// - DD.MM.YYYY HH:MM
// - HH:MM DD.MM.YYYY
// =======================

export const parseUaDateTimeSafe = (dateStr) => {
  if (typeof dateStr !== "string" || !dateStr.trim()) return null;

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 2) return null;

  const [a, b] = parts;
  const isDateFirst = a.includes(".");

  const datePart = isDateFirst ? a : b;
  const timePart = isDateFirst ? b : a;

  // Use Luxon's fromFormat with strict parsing
  const kyivDateTime = DateTime.fromFormat(`${datePart} ${timePart}`, "dd.MM.yyyy HH:mm", {
    zone: KYIV_TZ,
    locale: UA_LOCALE,
  });

  // Luxon validates everything: valid dates, leap years, time ranges, etc.
  if (!kyivDateTime.isValid) return null;

  return kyivDateTime.toJSDate();
};

// =======================
// Time difference utils
// =======================

export const formatTimeDifference = (diffMs) => {
  // Handle zero or negative differences
  if (diffMs <= 0) return null;

  const duration = DateTime.fromMillis(0)
    .plus({ milliseconds: diffMs })
    .diff(DateTime.fromMillis(0));

  const days = Math.floor(duration.as("days"));
  const hours = Math.floor(duration.as("hours") % 24);
  const minutes = Math.floor(duration.as("minutes") % 60);

  // Always show at least minutes, even if 0
  const parts = [];
  if (days > 0) parts.push(`${days} дн`);
  if (hours > 0 || days > 0) parts.push(`${hours} год`); // Show hours if there are days
  parts.push(`${minutes} хв`);

  return parts.join(" ");
};

export const calculateTimeDifference = (from, to) => {
  const d1 = parseUaDateTimeSafe(from);
  if (!d1) return null;

  const d2 = parseUaDateTimeSafe(to);
  if (!d2) return null;

  // Use Luxon to calculate difference
  const dt1 = DateTime.fromJSDate(d1);
  const dt2 = DateTime.fromJSDate(d2);
  const diffMs = Math.abs(dt2.diff(dt1).as("milliseconds"));

  return formatTimeDifference(diffMs);
};

export function addNextDay(unixSeconds) {
  return DateTime.fromSeconds(unixSeconds).plus({ days: 1 }).toSeconds();
}

// =======================
// Kyiv / UA formatting
// =======================

export const getCurrentUADateTime = () => {
  return DateTime.now().setZone(KYIV_TZ).toFormat("HH:mm dd.MM.yyyy");
};

export const toUADayMonthFromUnix = (unixSeconds) => {
  return DateTime.fromSeconds(unixSeconds).setZone(KYIV_TZ).setLocale(UA_LOCALE).toFormat("d MMMM");
};

export const formatUATime = (date) => {
  return DateTime.fromJSDate(date).setZone(KYIV_TZ).setLocale(UA_LOCALE).toFormat("HH:mm");
};

export const formatUADate = (date) => {
  return DateTime.fromJSDate(date).setZone(KYIV_TZ).setLocale(UA_LOCALE).toFormat("d MMMM");
};
