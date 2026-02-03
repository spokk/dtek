const KYIV_TZ = "Europe/Kyiv";
const UA_LOCALE = "uk-UA";

const MS = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};

// =======================
// Core date parser
// Supports:
// - DD.MM.YYYY HH:MM
// - HH:MM DD.MM.YYYY
// =======================

export const parseUaDateTimeSafe = (dateStr) => {
  if (typeof dateStr !== "string" || !dateStr.trim()) {
    return null;
  }

  const parts = dateStr.trim().split(" ");
  if (parts.length !== 2) return null;

  const [a, b] = parts;
  const isDateFirst = a.includes(".");

  const datePart = isDateFirst ? a : b;
  const timePart = isDateFirst ? b : a;

  const [day, month, year] = datePart.split(".").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if ([day, month, year, hour, minute].some(Number.isNaN)) {
    return null;
  }

  const date = new Date(year, month - 1, day, hour, minute);
  return Number.isNaN(date.getTime()) ? null : date;
};

// =======================
// Time difference utils
// =======================

export const formatTimeDifference = (diffMs) => {
  const days = Math.floor(diffMs / MS.day);
  const hours = Math.floor((diffMs % MS.day) / MS.hour);
  const minutes = Math.floor((diffMs % MS.hour) / MS.minute);

  return [days > 0 && `${days} дн`, `${hours} год`, `${minutes} хв`].filter(Boolean).join(" ");
};

export const calculateTimeDifference = (date1Str, date2Str) => {
  const d1 = parseUaDateTimeSafe(date1Str);
  const d2 = parseUaDateTimeSafe(date2Str);

  if (!d1 || !d2) return null;

  const diffMs = Math.abs(d2 - d1);
  return diffMs > 0 ? formatTimeDifference(diffMs) : null;
};

// =======================
// Kyiv / UA formatting
// =======================

export const getCurrentUADate = () => {
  return new Date()
    .toLocaleString(UA_LOCALE, {
      timeZone: KYIV_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");
};

export const toUADayMonth = (unixSeconds) => {
  return new Intl.DateTimeFormat(UA_LOCALE, {
    timeZone: KYIV_TZ,
    day: "numeric",
    month: "long",
  }).format(new Date(unixSeconds * 1000));
};

export const getFormattedUATime = (date) =>
  date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const getFormattedUADate = (date) =>
  date.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
  });

export function add24Hours(unixSeconds) {
  return unixSeconds + 86400;
}
