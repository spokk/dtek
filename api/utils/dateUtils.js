export const parseKyivDateString = (dateStr) => {
  if (typeof dateStr !== "string" || !dateStr.trim()) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }

  const [part1, part2] = dateStr.split(" ");
  if (!part1 || !part2) {
    throw new Error(
      `Invalid date format: expected "DD.MM.YYYY HH:MM" or "HH:MM DD.MM.YYYY", got "${dateStr}"`,
    );
  }

  const isDateFirst = part1.includes(".");
  const [datePart, timePart] = isDateFirst ? [part1, part2] : [part2, part1];

  const [day, month, year] = datePart.split(".").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    isNaN(day) ||
    isNaN(month) ||
    isNaN(year)
  ) {
    throw new Error(`Invalid date values: "${dateStr}"`);
  }

  return new Date(year, month - 1, day, hours, minutes);
};

export const formatTimeDifference = (diffMs) => {
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

  const timeParts = [
    diffDays > 0 && `${diffDays} дн`,
    `${diffHours} год`,
    `${diffMinutes} хв`,
  ].filter(Boolean);

  return timeParts.join(" ");
};

export const calculateTimeDifference = (date1Str, date2Str) => {
  const date1 = parseKyivDateString(date1Str);
  const date2 = parseKyivDateString(date2Str);
  const diffMs = Math.abs(date2 - date1);

  return diffMs <= 0 ? null : formatTimeDifference(diffMs);
};

export const getCurrentDateKyiv = () => {
  return new Date()
    .toLocaleString("uk-UA", {
      timeZone: "Europe/Kyiv",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");
};

export const toKyivDayMonth = (unixSeconds) => {
  const date = new Date(unixSeconds * 1000);

  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "long",
  }).format(date);
};

export function add24Hours(unixSeconds) {
  return unixSeconds + 86400;
}
