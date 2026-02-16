import { parsePowerRow, calculateLightPercent, getRegionalPowerStats } from "./powerUtils.js";
import type { PowerRow, PowerConfig } from "../types.js";

const buildRow = (overrides: Partial<Record<string, string>> = {}): string => {
  const d: Record<string, string> = {
    id: "123",
    light: "1",
    timestamp: "2025-06-16T12:00:00Z",
    location: "с. Місто А->вул. Тестова 1",
    extra: "x",
    people: "5",
    lat: "50.5",
    lon: "30.2",
    ...overrides,
  };
  return [d.id, d.light, d.timestamp, d.location, d.extra, d.people, d.lat, d.lon].join(";&&&;");
};

function makePowerRow(overrides: Partial<PowerRow> = {}): PowerRow {
  return {
    city: "Місто А",
    address: "вул. Тестова 1",
    timestamp: new Date("2025-06-16T12:00:00Z"),
    peopleCount: 5,
    lightStatus: 1,
    lat: 50.5,
    lon: 30.2,
    raw: "",
    ...overrides,
  };
}

function makePowerConfig(overrides: Partial<PowerConfig> = {}): PowerConfig {
  return {
    cities: "Місто А,Місто Б",
    region: "Тестовий район",
    ...overrides,
  };
}

describe("parsePowerRow", () => {
  it("parses a valid row with power on", () => {
    const result = parsePowerRow(buildRow());

    expect(result).toEqual({
      city: "Місто А",
      address: "вул. Тестова 1",
      timestamp: new Date("2025-06-16T12:00:00Z"),
      peopleCount: 5,
      lightStatus: 1,
      lat: 50.5,
      lon: 30.2,
      raw: buildRow(),
    });
  });

  it("parses power off status", () => {
    const result = parsePowerRow(buildRow({ light: "2" }));

    expect(result?.lightStatus).toBe(0);
  });

  it("returns null lightStatus for unknown value", () => {
    const result = parsePowerRow(buildRow({ light: "3" }));

    expect(result?.lightStatus).toBeNull();
  });

  it("returns null for empty or falsy row", () => {
    expect(parsePowerRow("")).toBeNull();
    expect(parsePowerRow(null as never)).toBeNull();
    expect(parsePowerRow(undefined as never)).toBeNull();
  });

  it("returns null when fewer than 6 fields", () => {
    expect(parsePowerRow("a;&&&;b;&&&;c")).toBeNull();
  });

  it("returns null when location is empty", () => {
    expect(parsePowerRow(buildRow({ location: "" }))).toBeNull();
  });

  it("returns null address when location has no arrow", () => {
    const result = parsePowerRow(buildRow({ location: "Місто А" }));

    expect(result?.city).toBe("Місто А");
    expect(result?.address).toBeNull();
  });

  it("strips 'с.' prefix from city name", () => {
    const result = parsePowerRow(buildRow({ location: "с.Місто Б->вул. Зразкова" }));

    expect(result?.city).toBe("Місто Б");
  });

  it("returns null timestamp for invalid date", () => {
    const result = parsePowerRow(buildRow({ timestamp: "not-a-date" }));

    expect(result?.timestamp).toBeNull();
  });

  it("returns null peopleCount for non-numeric value", () => {
    const result = parsePowerRow(buildRow({ people: "abc" }));

    expect(result?.peopleCount).toBeNull();
  });

  it("returns null lat/lon for non-numeric values", () => {
    const result = parsePowerRow(buildRow({ lat: "x", lon: "y" }));

    expect(result?.lat).toBeNull();
    expect(result?.lon).toBeNull();
  });
});

describe("calculateLightPercent", () => {
  it("returns 0 for empty array", () => {
    expect(calculateLightPercent([])).toBe(0);
  });

  it("returns 100 when all houses have power", () => {
    const houses = [makePowerRow({ lightStatus: 1 }), makePowerRow({ lightStatus: 1 })];

    expect(calculateLightPercent(houses)).toBe(100);
  });

  it("returns 0 when no houses have power", () => {
    const houses = [makePowerRow({ lightStatus: 0 }), makePowerRow({ lightStatus: 0 })];

    expect(calculateLightPercent(houses)).toBe(0);
  });

  it("calculates correct percentage", () => {
    const houses = [
      makePowerRow({ lightStatus: 1 }),
      makePowerRow({ lightStatus: 0 }),
      makePowerRow({ lightStatus: 1 }),
    ];

    expect(calculateLightPercent(houses)).toBe(66.67);
  });
});

describe("getRegionalPowerStats", () => {
  it("returns null for empty entries", () => {
    expect(getRegionalPowerStats([], makePowerConfig())).toBeNull();
    expect(getRegionalPowerStats(null, makePowerConfig())).toBeNull();
  });

  it("returns null when no entries match configured cities", () => {
    const entries = [makePowerRow({ city: "Місто В" })];

    expect(getRegionalPowerStats(entries, makePowerConfig())).toBeNull();
  });

  it("returns stats for matching cities (case-insensitive)", () => {
    const entries = [
      makePowerRow({ city: "місто а", lightStatus: 1 }),
      makePowerRow({ city: "Місто Б", lightStatus: 0 }),
    ];

    expect(getRegionalPowerStats(entries, makePowerConfig())).toEqual({
      region: "Тестовий район",
      lightPercent: 50,
    });
  });

  it("returns null when cities config is empty", () => {
    const entries = [makePowerRow({ city: "Місто А" })];

    expect(getRegionalPowerStats(entries, makePowerConfig({ cities: "" }))).toBeNull();
  });
});
