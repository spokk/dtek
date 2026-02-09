import { config } from "../config.js";

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

export function calculateLightPercent(houses = []) {
  if (!houses.length) return 0;

  const housesWithPower = houses.reduce((sum, house) => sum + (house.lightStatus === 1 ? 1 : 0), 0);

  return Math.round((housesWithPower / houses.length) * 10000) / 100;
}

export function getRegionalPowerStats(svitlobotEntries) {
  if (!svitlobotEntries?.length) return null;

  const citiesEnv = config.power.cities;
  const cityNames = citiesEnv
    .split(",")
    .map((city) => city.trim().toLowerCase())
    .filter(Boolean);

  if (!cityNames.length) return null;

  const cityNamesSet = new Set(cityNames);

  const housesFromRegion = svitlobotEntries.filter(
    (entry) => entry.city && cityNamesSet.has(entry.city.toLowerCase().trim()),
  );

  if (!housesFromRegion.length) return null;

  const lightPercent = calculateLightPercent(housesFromRegion);
  const region = config.power.region;

  return { region, lightPercent };
}
