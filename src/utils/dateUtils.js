import { DateTime } from "luxon";

const KYIV_TZ = "Europe/Kyiv";
const UA_LOCALE = "uk-UA";

const MS_IN_SECOND = 1000;

const MS = {
  minute: 60 * MS_IN_SECOND,
  hour: 60 * 60 * MS_IN_SECOND,
  day: 24 * 60 * 60 * MS_IN_SECOND,
};

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

  const dateParts = datePart.split(".");
  const timeParts = timePart.split(":");

  if (dateParts.length !== 3 || timeParts.length !== 2) return null;

  const [day, month, year] = dateParts.map(Number);
  const [hour, minute] = timeParts.map(Number);

  if ([day, month, year, hour, minute].some(Number.isNaN)) return null;
  if (
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 1000 ||
    year > 9999 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  )
    return null;

  const kyivDateTime = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: KYIV_TZ, locale: UA_LOCALE },
  );

  if (!kyivDateTime.isValid) return null;

  return kyivDateTime.toJSDate();
};
// =======================
// Time difference utils
// =======================

export const formatTimeDifference = (diffMs) => {
  // Handle zero or negative differences
  if (diffMs <= 0) return null;

  const days = Math.floor(diffMs / MS.day);
  const hours = Math.floor((diffMs % MS.day) / MS.hour);
  const minutes = Math.floor((diffMs % MS.hour) / MS.minute);

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

  // diff in milliseconds
  const diffMs = Math.abs(d2 - d1);

  return formatTimeDifference(diffMs);
};

export function addNextDay(unixSeconds) {
  const date = new Date(unixSeconds * MS_IN_SECOND);
  date.setDate(date.getDate() + 1);
  return Math.floor(date.getTime() / MS_IN_SECOND);
}

// =======================
// Kyiv / UA formatting
// =======================

const dayMonthFormatter = new Intl.DateTimeFormat(UA_LOCALE, {
  timeZone: KYIV_TZ,
  day: "numeric",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat(UA_LOCALE, {
  timeZone: KYIV_TZ,
  hour: "2-digit",
  minute: "2-digit",
});

export const getCurrentUADateTime = () => {
  return DateTime.now().setZone(KYIV_TZ).toFormat("HH:mm dd.MM.yyyy");
};

export const toUADayMonthFromUnix = (unixSeconds) => {
  return dayMonthFormatter.format(new Date(unixSeconds * 1000));
};

export const formatUATime = (date) => {
  return timeFormatter.format(date);
};

export const formatUADate = (date) => {
  return dayMonthFormatter.format(date);
};
