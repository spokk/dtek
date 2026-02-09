import { extractScheduleData } from "./outageService.js";
import { config } from "../config.js";

jest.mock("../config.js", () => ({
  config: {
    dtek: {
      house: "123",
    },
  },
}));

beforeEach(() => {
  config.dtek.house = "123";
});

const todayUNIX = 1750032000;
const tomorrowUNIX = 1750118400;

const buildDtekResponse = (overrides = {}) => ({
  fact: {
    today: String(todayUNIX),
    data: {
      [todayUNIX]: {
        GPV1: { 1: "yes", 2: "no" },
      },
      [tomorrowUNIX]: {
        GPV1: { 1: "no", 2: "yes" },
      },
    },
  },
  preset: { time_zone: {}, time_type: {} },
  data: {
    123: { sub_type_reason: ["GPV1"] },
  },
  ...overrides,
});

describe("extractScheduleData", () => {
  it("returns schedule data with today and tomorrow hours", () => {
    const result = extractScheduleData(buildDtekResponse());

    expect(result).toEqual({
      todayUNIX,
      tomorrowUNIX,
      reasonKey: "GPV1",
      preset: { time_zone: {}, time_type: {} },
      hoursDataToday: { 1: "yes", 2: "no" },
      hoursDataTomorrow: { 1: "no", 2: "yes" },
    });
  });

  it("uses explicit houseData when provided", () => {
    const dtekResponse = buildDtekResponse();
    const houseData = { sub_type_reason: ["GPV2"] };

    dtekResponse.fact.data[todayUNIX].GPV2 = { 1: "yes" };
    dtekResponse.fact.data[tomorrowUNIX].GPV2 = { 1: "no" };

    const result = extractScheduleData(dtekResponse, houseData);

    expect(result.reasonKey).toBe("GPV2");
    expect(result.hoursDataToday).toEqual({ 1: "yes" });
  });

  it("falls back to getHouseDataFromResponse when houseData is not provided", () => {
    config.dtek.house = "123";
    const result = extractScheduleData(buildDtekResponse());

    expect(result.reasonKey).toBe("GPV1");
  });

  it("returns null when fact.today is invalid", () => {
    const dtekResponse = buildDtekResponse();
    dtekResponse.fact.today = null;

    expect(extractScheduleData(dtekResponse)).toBeNull();
  });

  it("returns null when reasonKey is missing", () => {
    const houseData = { sub_type_reason: [] };

    expect(extractScheduleData(buildDtekResponse(), houseData)).toBeNull();
  });

  it("returns null when houseData is null and config house not in response", () => {
    config.dtek.house = "999";

    expect(extractScheduleData(buildDtekResponse(), null)).toBeNull();
  });

  it("returns undefined hoursDataTomorrow when tomorrow data missing", () => {
    const dtekResponse = buildDtekResponse();
    delete dtekResponse.fact.data[tomorrowUNIX];

    const result = extractScheduleData(dtekResponse);

    expect(result.hoursDataToday).toEqual({ 1: "yes", 2: "no" });
    expect(result.hoursDataTomorrow).toBeUndefined();
  });

  it("returns undefined hoursDataToday when today data missing for reasonKey", () => {
    const dtekResponse = buildDtekResponse();
    delete dtekResponse.fact.data[todayUNIX].GPV1;

    const result = extractScheduleData(dtekResponse);

    expect(result.hoursDataToday).toBeUndefined();
  });

  it("includes preset from dtekResponse", () => {
    const preset = { time_zone: { 0: ["a"] }, time_type: { yes: "Є" } };
    const result = extractScheduleData(buildDtekResponse({ preset }));

    expect(result.preset).toBe(preset);
  });

  it("computes correct tomorrowUNIX", () => {
    const result = extractScheduleData(buildDtekResponse());

    expect(result.tomorrowUNIX - result.todayUNIX).toBe(86400);
  });
});
