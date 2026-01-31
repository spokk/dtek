const FIELD_INDEX = {
  LIGHT_RAW: 1,
  TIMESTAMP: 2,
  LOCATION: 3,
  PEOPLE: 5,
  LAT: 6,
  LON: 7,
};

function parseLightStatus(value) {
  if (value === 1) return 1; // power on
  if (value === 2) return 0; // power off
  return null;
}

function parseLocation(locationRaw) {
  if (!locationRaw) return null;

  const parts = locationRaw.split("->");
  const city = parts[0]?.replace(/^с\. ?/i, "").trim();

  if (!city) return null;

  return {
    city,
    address: parts[1]?.trim() || null,
  };
}

export function parsePowerRow(row) {
  if (!row) return null;

  const fields = row.split(";&&&;");
  if (fields.length < 6) return null;

  const location = parseLocation(fields[FIELD_INDEX.LOCATION]);
  if (!location) return null;

  const timestamp = new Date(fields[FIELD_INDEX.TIMESTAMP]);
  const peopleCount = Number(fields[FIELD_INDEX.PEOPLE]);
  const lat = Number(fields[FIELD_INDEX.LAT]);
  const lon = Number(fields[FIELD_INDEX.LON]);

  return {
    city: location.city,
    address: location.address,
    timestamp: Number.isNaN(timestamp.getTime()) ? null : timestamp,
    peopleCount: Number.isFinite(peopleCount) ? peopleCount : null,
    lightStatus: parseLightStatus(Number(fields[FIELD_INDEX.LIGHT_RAW])),
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    raw: row,
  };
}

export function filterCity(entries, cityName) {
  const nameLower = cityName.toLowerCase();
  return entries.filter((e) => e.city?.toLowerCase() === nameLower);
}

export function calculateLightPercent(entries = []) {
  if (!entries.length) return 0;

  const on = entries.reduce((sum, e) => sum + (e.lightStatus === 1), 0);

  return Math.round((on / entries.length) * 10000) / 100;
}

export function getPowerCitiesStats(cityNames, entries) {
  if (!Array.isArray(cityNames) || !cityNames.length) return null;
  if (!entries?.length) return null;

  const allCityEntries = entries.filter(
    (e) =>
      e.city && cityNames.some((city) => city.toLowerCase().trim() === e.city.toLowerCase().trim()),
  );

  if (!allCityEntries.length) return null;

  const lightPercent = calculateLightPercent(allCityEntries);
  const region = process.env.POWER_REGION || "Регіон";

  return `<b>📊 ${region}:</b> ${lightPercent}% з електропостачанням`;
}
