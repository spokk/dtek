import { formatOutageMessage } from "./messageBuilder.js";
import type { OutageData, HoursData } from "../types.js";

const todayUNIX = 1750032000;
const tomorrowUNIX = todayUNIX + 86400;

const preset = {
  sch_names: { GPV1: "Черга 1" },
  time_type: {
    yes: "Є світло",
    no: "Немає світла",
    mfirst: "Можливо",
    msecond: "Можливо",
  },
};

const defaultHoursDataToday: HoursData = { "0": "yes", "1": "no" };

const buildOutageData = (overrides: Partial<OutageData> = {}): OutageData => ({
  dtekResponse: {
    fact: {},
    preset: {},
    updateTimestamp: "12:00 15.06.2025",
  },
  houseData: {
    sub_type_reason: ["GPV1"],
  },
  scheduleData: {
    todayUNIX,
    tomorrowUNIX,
    reasonKey: "GPV1",
    preset,
    hoursDataToday: defaultHoursDataToday,
    hoursDataTomorrow: undefined,
  },
  powerStats: null,
  currentDate: "12:00 15.06.2025",
  ...overrides,
});

describe("messageBuilder", () => {
  describe("formatOutageMessage", () => {
    it("returns no-outage message when houseData has no outage period", () => {
      const result = formatOutageMessage(buildOutageData());

      expect(result).toContain("Відключень не зафіксовано");
      expect(result).toContain("Черга 1");
    });

    it("returns active outage message when houseData has outage period", () => {
      const result = formatOutageMessage(
        buildOutageData({
          houseData: {
            sub_type_reason: ["GPV1"],
            sub_type: "Планове відключення",
            start_date: "10:00 15.06.2025",
            end_date: "18:00 15.06.2025",
          },
        }),
      );

      expect(result).toContain("Відключення.");
      expect(result).toContain("Планове відключення");
    });

    it("includes schedule blocks in output", () => {
      const result = formatOutageMessage(
        buildOutageData({
          scheduleData: {
            todayUNIX,
            tomorrowUNIX,
            reasonKey: "GPV1",
            preset,
            hoursDataToday: { "1": "yes", "2": "no" } as HoursData,
            hoursDataTomorrow: undefined,
          },
        }),
      );

      expect(result).toContain("Графік відключень");
      expect(result).toContain("🟢");
      expect(result).toContain("🔴");
    });

    it("includes powerStats when provided", () => {
      const result = formatOutageMessage(
        buildOutageData({
          powerStats: { region: "Регіон", lightPercent: 85 },
        }),
      );

      expect(result).toContain("85% з електропостачанням");
    });

    it("includes updateTimestamp", () => {
      const result = formatOutageMessage(buildOutageData());

      expect(result).toContain("12:00 15.06.2025");
    });

    it("returns empty schedule when scheduleData is null", () => {
      const result = formatOutageMessage(
        buildOutageData({
          scheduleData: null,
        }),
      );

      expect(result).toContain("Відключень не зафіксовано");
      expect(result).not.toContain("Графік відключень");
    });

    it("handles houseData with only end_date", () => {
      const result = formatOutageMessage(
        buildOutageData({
          houseData: {
            sub_type_reason: ["GPV1"],
            sub_type: "Аварійне",
            end_date: "18:00 15.06.2025",
          },
        }),
      );

      expect(result).toContain("Відключення.");
      expect(result).toContain("Аварійне");
    });

    it("handles houseData with only start_date", () => {
      const result = formatOutageMessage(
        buildOutageData({
          houseData: {
            sub_type_reason: ["GPV1"],
            sub_type: "Аварійне",
            start_date: "10:00 15.06.2025",
          },
        }),
      );

      expect(result).toContain("Відключення.");
      expect(result).toContain("Аварійне");
    });

    it("handles null houseData", () => {
      const result = formatOutageMessage(
        buildOutageData({
          houseData: null,
          scheduleData: null,
        }),
      );

      expect(result).toContain("Відключень не зафіксовано");
      expect(result).toContain("Невідомо");
    });
  });
});
