import { extractScheduleData, getOutageData } from "./outageService.js";
import { fetchDTEKOutageData } from "../infrastructure/dtekApi.js";
import { fetchSvitlobotOutageData } from "../infrastructure/svitlobotApi.js";
import { config } from "../config.js";

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

    expect(result!.reasonKey).toBe("GPV2");
    expect(result!.hoursDataToday).toEqual({ 1: "yes" });
  });

  it("falls back to getHouseDataFromResponse when houseData is not provided", () => {
    config.dtek.house = "123";
    const result = extractScheduleData(buildDtekResponse());

    expect(result!.reasonKey).toBe("GPV1");
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

    expect(result!.hoursDataToday).toEqual({ 1: "yes", 2: "no" });
    expect(result!.hoursDataTomorrow).toBeUndefined();
  });

  it("returns undefined hoursDataToday when today data missing for reasonKey", () => {
    const dtekResponse = buildDtekResponse();
    delete dtekResponse.fact.data[todayUNIX].GPV1;

    const result = extractScheduleData(dtekResponse);

    expect(result!.hoursDataToday).toBeUndefined();
  });

  it("includes preset from dtekResponse", () => {
    const preset = { time_zone: { 0: ["a"] }, time_type: { yes: "Є" } };
    const result = extractScheduleData(buildDtekResponse({ preset }));

    expect(result!.preset).toBe(preset);
  });

  it("computes correct tomorrowUNIX", () => {
    const result = extractScheduleData(buildDtekResponse());

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
    expect(result.scheduleData!.reasonKey).toBe("GPV1");
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
