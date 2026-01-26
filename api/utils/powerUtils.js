export function parsePowerRow(row) {
  const fields = row.split(';&&&;');

  if (fields.length < 10) return null;

  const timestamp = new Date(fields[2]);
  let locationRaw = fields[3] || '';

  let [city, address] = locationRaw.includes('->')
    ? locationRaw.split('->').map(s => s.trim())
    : [locationRaw.trim() || null, null];

  if (!city) return null;

  city = city.replace(/^с\. ?/i, '').trim();

  const peopleCount = Number(fields[5]);
  const lat = Number(fields[6]);
  const lon = Number(fields[7]);
  const lightStatus = Number(fields[8]);

  return {
    city,
    address: address || null,
    timestamp: isNaN(timestamp.getTime()) ? null : timestamp,
    peopleCount: Number.isFinite(peopleCount) ? peopleCount : null,
    lightStatus: [0, 1, 2].includes(lightStatus) ? lightStatus : null,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    raw: row
  };
}

export function parsePowerResponse(rawText) {
  return rawText
    .trim()
    .split('\n')
    .map(parsePowerRow)
    .filter(Boolean);
}

export function filterCity(entries, cityName) {
  const nameLower = cityName.toLowerCase();
  return entries.filter(e => e.city?.toLowerCase() === nameLower);
}

export function calculateLightPercent(entries) {
  if (!entries.length) return 0;

  const totalPlaces = entries.length;
  const placesWithLight = entries.filter(e => e.lightStatus === 1).length;

  return Math.round((placesWithLight / totalPlaces) * 100);
}

export function getPowerCityStats(cityName, entries) {
  if (!cityName || !entries?.length) return '';

  const cityEntries = filterCity(entries, cityName);
  if (!cityEntries.length) return '';

  const lightPercent = calculateLightPercent(cityEntries);
  return `${cityName} має світло у ${lightPercent}% місць.`;
}