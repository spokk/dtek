import { formatScheduleText, buildScheduleBlocks } from "./scheduleFormatter";

const timeZone = {
  0: ["unused", "00:00", "01:00"],
  1: ["unused", "01:00", "02:00"],
  2: ["unused", "02:00", "03:00"],
};

const timeType = {
  yes: "Є світло",
  no: "Немає світла",
  mfirst: "Можливо",
  msecond: "Можливо",
};

const todayUNIX = 1750032000;
const tomorrowUNIX = 1750118400;

describe("scheduleFormatter", () => {
  describe("formatScheduleText", () => {
    it("should return empty string when hoursData is null", () => {
      expect(formatScheduleText(null, timeZone, timeType)).toBe("");
    });

    it("should return empty string when timeZone is undefined", () => {
      expect(formatScheduleText({ 0: "yes" }, undefined, timeType)).toBe("");
    });

    it("should return empty string when timeType is null", () => {
      expect(formatScheduleText({ 0: "yes" }, timeZone, null)).toBe("");
    });

    it("should format a single yes hour with green icon", () => {
      const result = formatScheduleText({ 0: "yes" }, timeZone, timeType);
      expect(result).toBe("🟢 00:00 – 01:00 — Є світло");
    });

    it("should format a single no hour with red icon", () => {
      const result = formatScheduleText({ 0: "no" }, timeZone, timeType);
      expect(result).toBe("🔴 00:00 – 01:00 — Немає світла");
    });

    it("should split first status into two half-hour segments", () => {
      const result = formatScheduleText({ 0: "first" }, timeZone, timeType);
      const lines = result.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe("🔴 00:00 – 00:30 — Немає світла");
      expect(lines[1]).toBe("🟢 00:30 – 01:00 — Є світло");
    });

    it("should split second status into two half-hour segments", () => {
      const result = formatScheduleText({ 0: "second" }, timeZone, timeType);
      const lines = result.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe("🟢 00:00 – 00:30 — Є світло");
      expect(lines[1]).toBe("🔴 00:30 – 01:00 — Немає світла");
    });

    it("should use yellow icon for mfirst status", () => {
      const result = formatScheduleText({ 0: "mfirst" }, timeZone, timeType);
      expect(result).toBe("🟡 00:00 – 01:00 — Можливо");
    });

    it("should use yellow icon for msecond status", () => {
      const result = formatScheduleText({ 0: "msecond" }, timeZone, timeType);
      expect(result).toBe("🟡 00:00 – 01:00 — Можливо");
    });

    it("should merge adjacent segments with the same status", () => {
      const hoursData = { 0: "yes", 1: "yes", 2: "yes" };
      const result = formatScheduleText(hoursData, timeZone, timeType);
      expect(result).toBe("🟢 00:00 – 03:00 — Є світло");
    });

    it("should handle multiple hours in sorted order", () => {
      const hoursData = { 2: "no", 0: "yes", 1: "yes" };
      const result = formatScheduleText(hoursData, timeZone, timeType);
      const lines = result.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe("🟢 00:00 – 02:00 — Є світло");
      expect(lines[1]).toBe("🔴 02:00 – 03:00 — Немає світла");
    });
  });

  describe("buildScheduleBlocks", () => {
    const preset = { time_zone: timeZone, time_type: timeType };

    it("should always include today schedule block", () => {
      const hoursDataToday = { 0: "yes", 1: "no" };
      const blocks = buildScheduleBlocks(todayUNIX, tomorrowUNIX, hoursDataToday, null, preset);
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toContain("16 червня");
      expect(blocks[0]).toContain("🟢");
      expect(blocks[0]).toContain("🔴");
    });

    it("should include tomorrow block when tomorrow has outages", () => {
      const hoursDataToday = { 0: "yes" };
      const hoursDataTomorrow = { 0: "no" };
      const blocks = buildScheduleBlocks(
        todayUNIX,
        tomorrowUNIX,
        hoursDataToday,
        hoursDataTomorrow,
        preset,
      );
      expect(blocks).toHaveLength(2);
      expect(blocks[1]).toContain("17 червня");
    });

    it("should not include tomorrow block when all hours are yes", () => {
      const hoursDataToday = { 0: "yes" };
      const hoursDataTomorrow = { 0: "yes", 1: "yes" };
      const blocks = buildScheduleBlocks(
        todayUNIX,
        tomorrowUNIX,
        hoursDataToday,
        hoursDataTomorrow,
        preset,
      );
      expect(blocks).toHaveLength(1);
    });

    it("should not include tomorrow block when hoursDataTomorrow is null", () => {
      const hoursDataToday = { 0: "yes" };
      const blocks = buildScheduleBlocks(todayUNIX, tomorrowUNIX, hoursDataToday, null, preset);
      expect(blocks).toHaveLength(1);
    });
  });
});
