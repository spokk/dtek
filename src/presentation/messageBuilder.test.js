import { formatOutageMessage } from "./messageBuilder";

const timeZone = {
  0: ["unused", "00:00", "01:00"],
  1: ["unused", "01:00", "02:00"],
};

const timeType = {
  yes: "Є світло",
  no: "Немає світла",
  mfirst: "Можливо",
  msecond: "Можливо",
};

const todayUNIX = 1750032000;

const buildOutageData = (overrides = {}) => ({
  dtekResponse: {
    updateTimestamp: "12:00 15.06.2025",
    fact: {
      today: String(todayUNIX),
      data: {
        [todayUNIX]: {
          GPV1: { 0: "yes", 1: "no" },
        },
      },
    },
    preset: {
      sch_names: { GPV1: "Черга 1" },
      time_zone: timeZone,
      time_type: timeType,
    },
  },
  houseData: {
    sub_type_reason: ["GPV1"],
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
          dtekResponse: {
            updateTimestamp: "12:00 15.06.2025",
            fact: {
              today: String(todayUNIX),
              data: {
                [todayUNIX]: {
                  GPV1: { 1: "yes", 2: "no" },
                },
              },
            },
            preset: {
              sch_names: { GPV1: "Черга 1" },
              time_zone: timeZone,
              time_type: timeType,
            },
          },
          houseData: {
            sub_type_reason: ["GPV1"],
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
          powerStats: "<b>📊 Регіон:</b> 85% з електропостачанням",
        }),
      );

      expect(result).toContain("85% з електропостачанням");
    });

    it("includes updateTimestamp", () => {
      const result = formatOutageMessage(buildOutageData());

      expect(result).toContain("12:00 15.06.2025");
    });

    it("returns empty schedule when fact.today is invalid", () => {
      const data = buildOutageData();
      data.dtekResponse.fact.today = null;
      const result = formatOutageMessage(data);

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
        }),
      );

      expect(result).toContain("Відключень не зафіксовано");
      expect(result).toContain("Невідомо");
    });
  });
});
