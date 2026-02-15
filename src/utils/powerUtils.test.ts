import { parsePowerRow, calculateLightPercent, getRegionalPowerStats } from "./powerUtils.js";

const buildRow = (overrides = {}) => {
  const defaults = {
    id: "123",
    light: "1",
    timestamp: "2025-06-16T12:00:00Z",
    location: "с. Місто А->вул. Тестова 1",
    extra: "x",
    people: "5",
    lat: "50.5",
    lon: "30.2",
  };
  const d = { ...defaults, ...overrides };
  return [d.id, d.light, d.timestamp, d.location, d.extra, d.people, d.lat, d.lon].join(";&&&;");
};

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

    expect(result.lightStatus).toBe(0);
  });

  it("returns null lightStatus for unknown value", () => {
    const result = parsePowerRow(buildRow({ light: "3" }));

    expect(result.lightStatus).toBeNull();
  });

  it("returns null for empty or falsy row", () => {
    expect(parsePowerRow("")).toBeNull();
    expect(parsePowerRow(null)).toBeNull();
    expect(parsePowerRow(undefined)).toBeNull();
  });

  it("returns null when fewer than 6 fields", () => {
    expect(parsePowerRow("a;&&&;b;&&&;c")).toBeNull();
  });

  it("returns null when location is empty", () => {
    expect(parsePowerRow(buildRow({ location: "" }))).toBeNull();
  });

  it("returns null address when location has no arrow", () => {
    const result = parsePowerRow(buildRow({ location: "Місто А" }));

    expect(result.city).toBe("Місто А");
    expect(result.address).toBeNull();
  });

  it("strips 'с.' prefix from city name", () => {
    const result = parsePowerRow(buildRow({ location: "с.Місто Б->вул. Зразкова" }));

    expect(result.city).toBe("Місто Б");
  });

  it("returns null timestamp for invalid date", () => {
    const result = parsePowerRow(buildRow({ timestamp: "not-a-date" }));

    expect(result.timestamp).toBeNull();
  });

  it("returns null peopleCount for non-numeric value", () => {
    const result = parsePowerRow(buildRow({ people: "abc" }));

    expect(result.peopleCount).toBeNull();
  });

  it("returns null lat/lon for non-numeric values", () => {
    const result = parsePowerRow(buildRow({ lat: "x", lon: "y" }));

    expect(result.lat).toBeNull();
    expect(result.lon).toBeNull();
  });
});

describe("calculateLightPercent", () => {
  it("returns 0 for empty array", () => {
    expect(calculateLightPercent([])).toBe(0);
  });

  it("returns 0 for no arguments", () => {
    expect(calculateLightPercent()).toBe(0);
  });

  it("returns 100 when all houses have power", () => {
    const houses = [{ lightStatus: 1 }, { lightStatus: 1 }];

    expect(calculateLightPercent(houses)).toBe(100);
  });

  it("returns 0 when no houses have power", () => {
    const houses = [{ lightStatus: 0 }, { lightStatus: 0 }];

    expect(calculateLightPercent(houses)).toBe(0);
  });

  it("calculates correct percentage", () => {
    const houses = [{ lightStatus: 1 }, { lightStatus: 0 }, { lightStatus: 1 }];

    expect(calculateLightPercent(houses)).toBe(66.67);
  });
});

describe("getRegionalPowerStats", () => {
  it("returns null for empty entries", () => {
    expect(getRegionalPowerStats([])).toBeNull();
    expect(getRegionalPowerStats(null)).toBeNull();
  });

  it("returns null when no entries match configured cities", () => {
    const entries = [{ city: "Місто В", lightStatus: 1 }];

    expect(
      getRegionalPowerStats(entries, { cities: "Місто А,Місто Б", region: "Тестовий район" }),
    ).toBeNull();
  });

  it("returns stats for matching cities (case-insensitive)", () => {
    const entries = [
      { city: "місто а", lightStatus: 1 },
      { city: "Місто Б", lightStatus: 0 },
    ];

    expect(
      getRegionalPowerStats(entries, { cities: "Місто А,Місто Б", region: "Тестовий район" }),
    ).toEqual({
      region: "Тестовий район",
      lightPercent: 50,
    });
  });

  it("returns null when cities config is empty", () => {
    expect(
      getRegionalPowerStats([{ city: "Місто А", lightStatus: 1 }], {
        cities: "",
        region: "Тестовий район",
      }),
    ).toBeNull();
  });
});
