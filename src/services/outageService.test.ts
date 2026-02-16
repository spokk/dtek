import { extractScheduleData, getOutageData } from "./outageService.js";
import { fetchDTEKOutageData } from "../infrastructure/dtekApi.js";
import { fetchSvitlobotOutageData } from "../infrastructure/svitlobotApi.js";
import { config } from "../config.js";
import type { DtekResponse, HoursData, HouseData } from "../types.js";

jest.mock("../config.js", () => ({
  config: {
    dtek: {
      house: "123",
    },
    power: {
      cities: "Місто А",
      region: "Тестовий район",
    },
  },
}));

jest.mock("../infrastructure/dtekApi.js", () => ({
  fetchDTEKOutageData: jest.fn(),
}));

jest.mock("../infrastructure/svitlobotApi.js", () => ({
  fetchSvitlobotOutageData: jest.fn(),
}));

jest.mock("../utils/httpClient.js", () => ({
  withRetry: jest.fn((fn: () => unknown) => fn()),
}));

beforeEach(() => {
  config.dtek.house = "123";
});

const todayUNIX = 1750032000;
const tomorrowUNIX = 1750118400;

const todayKey = String(todayUNIX);
const tomorrowKey = String(tomorrowUNIX);

const defaultTodayHours: HoursData = { "1": "yes", "2": "no" };
const defaultTomorrowHours: HoursData = { "1": "no", "2": "yes" };

function buildDtekResponse(overrides: Partial<DtekResponse> = {}): DtekResponse {
  return {
    fact: {
      today: todayKey,
      data: {
        [todayKey]: { GPV1: defaultTodayHours },
        [tomorrowKey]: { GPV1: defaultTomorrowHours },
      },
    },
    preset: { time_type: {} },
    data: {
      "123": { sub_type_reason: ["GPV1"] },
    },
    ...overrides,
  };
}

describe("extractScheduleData", () => {
  it("returns schedule data with today and tomorrow hours", () => {
    const result = extractScheduleData(buildDtekResponse());

    expect(result).toEqual({
      todayUNIX,
      tomorrowUNIX,
      reasonKey: "GPV1",
      preset: { time_type: {} },
      hoursDataToday: { 1: "yes", 2: "no" },
      hoursDataTomorrow: { 1: "no", 2: "yes" },
    });
  });

  it("uses explicit houseData when provided", () => {
    const houseData: HouseData = { sub_type_reason: ["GPV2"] };
    const gpv2Today: HoursData = { "1": "yes" };
    const gpv2Tomorrow: HoursData = { "1": "no" };

    const dtekResponse = buildDtekResponse({
      fact: {
        today: todayKey,
        data: {
          [todayKey]: { GPV1: defaultTodayHours, GPV2: gpv2Today },
          [tomorrowKey]: { GPV1: defaultTomorrowHours, GPV2: gpv2Tomorrow },
        },
      },
    });

    const result = extractScheduleData(dtekResponse, houseData);

    expect(result).not.toBeNull();
    expect(result?.reasonKey).toBe("GPV2");
    expect(result?.hoursDataToday).toEqual({ "1": "yes" });
  });

  it("falls back to getHouseDataFromResponse when houseData is not provided", () => {
    config.dtek.house = "123";
    const result = extractScheduleData(buildDtekResponse());

    expect(result).not.toBeNull();
    expect(result?.reasonKey).toBe("GPV1");
  });

  it("returns null when fact.today is invalid", () => {
    const dtekResponse = buildDtekResponse({
      fact: { today: undefined, data: {} },
    });

    expect(extractScheduleData(dtekResponse)).toBeNull();
  });

  it("returns null when reasonKey is missing", () => {
    const houseData: HouseData = { sub_type_reason: [] };

    expect(extractScheduleData(buildDtekResponse(), houseData)).toBeNull();
  });

  it("returns null when houseData is null and config house not in response", () => {
    config.dtek.house = "999";

    expect(extractScheduleData(buildDtekResponse(), null)).toBeNull();
  });

  it("returns undefined hoursDataTomorrow when tomorrow data missing", () => {
    const dtekResponse = buildDtekResponse({
      fact: {
        today: todayKey,
        data: {
          [todayKey]: { GPV1: defaultTodayHours },
        },
      },
    });

    const result = extractScheduleData(dtekResponse);

    expect(result).not.toBeNull();
    expect(result?.hoursDataToday).toEqual({ "1": "yes", "2": "no" });
    expect(result?.hoursDataTomorrow).toBeUndefined();
  });

  it("returns undefined hoursDataToday when today data missing for reasonKey", () => {
    const dtekResponse = buildDtekResponse({
      fact: {
        today: todayKey,
        data: {
          [todayKey]: {},
          [tomorrowKey]: { GPV1: defaultTomorrowHours },
        },
      },
    });

    const result = extractScheduleData(dtekResponse);

    expect(result).not.toBeNull();
    expect(result?.hoursDataToday).toBeUndefined();
  });

  it("includes preset from dtekResponse", () => {
    const preset = { time_type: { yes: "Є" } };
    const result = extractScheduleData(buildDtekResponse({ preset }));

    expect(result).not.toBeNull();
    expect(result?.preset).toBe(preset);
  });

  it("computes correct tomorrowUNIX", () => {
    const result = extractScheduleData(buildDtekResponse());

    expect(result).not.toBeNull();
    expect(result!.tomorrowUNIX - result!.todayUNIX).toBe(86400);
  });
});

describe("getOutageData", () => {
  it("returns combined outage response when both sources succeed", async () => {
    const dtekResponse = buildDtekResponse();
    const svitlobotData = [{ city: "Місто А", lightStatus: 1 }];

    (fetchDTEKOutageData as jest.Mock).mockResolvedValue(dtekResponse);
    (fetchSvitlobotOutageData as jest.Mock).mockResolvedValue(svitlobotData);

    const result = await getOutageData();

    expect(result.dtekResponse).toBe(dtekResponse);
    expect(result.houseData).toEqual({ sub_type_reason: ["GPV1"] });
    expect(result.scheduleData).not.toBeNull();
    expect(result.scheduleData?.reasonKey).toBe("GPV1");
    expect(result.currentDate).toMatch(/\d{2}:\d{2} \d{2}\.\d{2}\.\d{4}/);
  });

  it("returns empty powerStats when svitlobot fails", async () => {
    (fetchDTEKOutageData as jest.Mock).mockResolvedValue(buildDtekResponse());
    (fetchSvitlobotOutageData as jest.Mock).mockRejectedValue(new Error("timeout"));

    const result = await getOutageData();

    expect(result.dtekResponse).toBeDefined();
    expect(result.powerStats).toBeNull();
  });

  it("returns powerStats when svitlobot returns matching city data", async () => {
    (fetchDTEKOutageData as jest.Mock).mockResolvedValue(buildDtekResponse());
    (fetchSvitlobotOutageData as jest.Mock).mockResolvedValue([
      { city: "Місто А", lightStatus: 1 },
      { city: "Місто А", lightStatus: 0 },
    ]);

    const result = await getOutageData();

    expect(result.powerStats).toEqual({
      region: "Тестовий район",
      lightPercent: 50,
    });
  });

  it("throws when DTEK data is unavailable (returns falsy)", async () => {
    (fetchDTEKOutageData as jest.Mock).mockResolvedValue(null);
    (fetchSvitlobotOutageData as jest.Mock).mockResolvedValue([]);

    await expect(getOutageData()).rejects.toThrow("DTEK data unavailable");
  });

  it("throws when DTEK API rejects", async () => {
    (fetchDTEKOutageData as jest.Mock).mockRejectedValue(new Error("DTEK API HTTP error 500"));
    (fetchSvitlobotOutageData as jest.Mock).mockResolvedValue([]);

    await expect(getOutageData()).rejects.toThrow("DTEK API HTTP error 500");
  });

  it("returns empty svitlobotData when svitlobot returns null", async () => {
    (fetchDTEKOutageData as jest.Mock).mockResolvedValue(buildDtekResponse());
    (fetchSvitlobotOutageData as jest.Mock).mockResolvedValue(null);

    const result = await getOutageData();

    expect(result.powerStats).toBeNull();
  });
});
