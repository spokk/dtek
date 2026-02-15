import { DateTime } from "luxon";
import {
  parseUaDateTimeSafe,
  formatTimeDifference,
  calculateTimeDifference,
  addNextDay,
  getCurrentUADateTime,
  toUADayMonthFromUnix,
  formatUATime,
  formatUADate,
} from "./dateUtils.js";

describe("dateUtils", () => {
  describe("parseUaDateTimeSafe", () => {
    describe("valid date formats", () => {
      it("should parse DD.MM.YYYY HH:MM format", () => {
        const result = parseUaDateTimeSafe("25.12.2023 14:30");
        expect(result).toBeInstanceOf(Date);
        expect(result!.getFullYear()).toBe(2023);
        expect(result!.getMonth()).toBe(11); // December is month 11
        expect(result!.getDate()).toBe(25);
        expect(result!.getHours()).toBe(14);
        expect(result!.getMinutes()).toBe(30);
      });

      it("should parse HH:MM DD.MM.YYYY format", () => {
        const result = parseUaDateTimeSafe("14:30 25.12.2023");
        expect(result).toBeInstanceOf(Date);
        expect(result!.getFullYear()).toBe(2023);
        expect(result!.getMonth()).toBe(11);
        expect(result!.getDate()).toBe(25);
        expect(result!.getHours()).toBe(14);
        expect(result!.getMinutes()).toBe(30);
      });

      it("should handle leap year dates", () => {
        const result = parseUaDateTimeSafe("29.02.2024 12:00");
        expect(result).toBeInstanceOf(Date);
        expect(result!.getDate()).toBe(29);
        expect(result!.getMonth()).toBe(1); // February
      });

      it("should handle midnight (00:00)", () => {
        const result = parseUaDateTimeSafe("01.01.2024 00:00");
        expect(result).toBeInstanceOf(Date);
        expect(result!.getHours()).toBe(0);
        expect(result!.getMinutes()).toBe(0);
      });

      it("should handle end of day (23:59)", () => {
        const result = parseUaDateTimeSafe("31.12.2023 23:59");
        expect(result).toBeInstanceOf(Date);
        expect(result!.getHours()).toBe(23);
        expect(result!.getMinutes()).toBe(59);
      });
    });

    describe("invalid inputs", () => {
      it("should return null for non-string input", () => {
        expect(parseUaDateTimeSafe(123 as unknown as string)).toBeNull();
        expect(parseUaDateTimeSafe(null as unknown as string)).toBeNull();
        expect(parseUaDateTimeSafe(undefined as unknown as string)).toBeNull();
        expect(parseUaDateTimeSafe({} as unknown as string)).toBeNull();
      });

      it("should return null for empty string", () => {
        expect(parseUaDateTimeSafe("")).toBeNull();
        expect(parseUaDateTimeSafe("   ")).toBeNull();
      });

      it("should return null for invalid date", () => {
        expect(parseUaDateTimeSafe("32.12.2023 14:30")).toBeNull();
        expect(parseUaDateTimeSafe("29.02.2023 14:30")).toBeNull(); // Not a leap year
        expect(parseUaDateTimeSafe("00.01.2023 14:30")).toBeNull();
        expect(parseUaDateTimeSafe("15.13.2023 14:30")).toBeNull();
      });

      it("should return null for invalid time", () => {
        // Note: Luxon treats 24:00 as valid (midnight of next day)
        // so we test truly invalid times
        expect(parseUaDateTimeSafe("25.12.2023 14:60")).toBeNull();
        expect(parseUaDateTimeSafe("25.12.2023 25:30")).toBeNull();
        expect(parseUaDateTimeSafe("25.12.2023 14:99")).toBeNull();
        expect(parseUaDateTimeSafe("25.12.2023 99:00")).toBeNull();
      });

      it("should handle 24:00 as valid (midnight of next day)", () => {
        const result = parseUaDateTimeSafe("25.12.2023 24:00");
        expect(result).toBeInstanceOf(Date);
        // 24:00 on Dec 25 = 00:00 on Dec 26
        expect(result!.getDate()).toBe(26);
        expect(result!.getMonth()).toBe(11); // December
        expect(result!.getHours()).toBe(0);
        expect(result!.getMinutes()).toBe(0);
      });

      it("should return null for wrong format", () => {
        expect(parseUaDateTimeSafe("2023-12-25 14:30")).toBeNull();
        expect(parseUaDateTimeSafe("25/12/2023 14:30")).toBeNull();
        expect(parseUaDateTimeSafe("25.12.2023")).toBeNull();
        expect(parseUaDateTimeSafe("14:30")).toBeNull();
      });

      it("should return null for too many parts", () => {
        expect(parseUaDateTimeSafe("25.12.2023 14:30 extra")).toBeNull();
      });

      it("should return null for single part", () => {
        expect(parseUaDateTimeSafe("25.12.2023")).toBeNull();
      });
    });
  });

  describe("formatTimeDifference", () => {
    it("should return null for zero difference", () => {
      expect(formatTimeDifference(0)).toBeNull();
    });

    it("should return null for negative difference", () => {
      expect(formatTimeDifference(-1000)).toBeNull();
    });

    it("should format minutes only", () => {
      expect(formatTimeDifference(5 * 60 * 1000)).toBe("5 хв");
      expect(formatTimeDifference(45 * 60 * 1000)).toBe("45 хв");
    });

    it("should format hours and minutes", () => {
      expect(formatTimeDifference(2 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe("2 год 30 хв");
      expect(formatTimeDifference(1 * 60 * 60 * 1000)).toBe("1 год 0 хв");
    });

    it("should format days, hours, and minutes", () => {
      expect(
        formatTimeDifference(2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 15 * 60 * 1000),
      ).toBe("2 дн 3 год 15 хв");
    });

    it("should show 0 minutes for very small differences", () => {
      expect(formatTimeDifference(1000)).toBe("0 хв"); // 1 second
      expect(formatTimeDifference(30 * 1000)).toBe("0 хв"); // 30 seconds
    });

    it("should handle large time differences", () => {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      expect(formatTimeDifference(thirtyDays)).toBe("30 дн 0 год 0 хв");
    });
  });

  describe("calculateTimeDifference", () => {
    it("should calculate difference between two valid dates", () => {
      const result = calculateTimeDifference("01.01.2024 10:00", "01.01.2024 12:30");
      expect(result).toBe("2 год 30 хв");
    });

    it("should return null when to is before from", () => {
      const result = calculateTimeDifference("01.01.2024 12:30", "01.01.2024 10:00");
      expect(result).toBeNull();
    });

    it("should return null if first date is invalid", () => {
      expect(calculateTimeDifference("invalid", "01.01.2024 12:30")).toBeNull();
    });

    it("should return null if second date is invalid", () => {
      expect(calculateTimeDifference("01.01.2024 10:00", "invalid")).toBeNull();
    });

    it("should return null if both dates are invalid", () => {
      expect(calculateTimeDifference("invalid1", "invalid2")).toBeNull();
    });

    it("should handle dates across different days", () => {
      const result = calculateTimeDifference("31.12.2023 23:00", "01.01.2024 02:30");
      expect(result).toBe("3 год 30 хв");
    });
  });

  describe("addNextDay", () => {
    it("should add one day to unix timestamp", () => {
      const unixTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 12, minute: 0 },
        { zone: "Europe/Kyiv" },
      ).toSeconds();

      const result = addNextDay(unixTime);
      const expected = DateTime.fromObject(
        { year: 2024, month: 1, day: 16, hour: 12, minute: 0 },
        { zone: "Europe/Kyiv" },
      ).toSeconds();

      expect(result).toBe(expected);
    });

    it("should handle month boundary", () => {
      const unixTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 31, hour: 0, minute: 0 },
        { zone: "Europe/Kyiv" },
      ).toSeconds();

      const result = addNextDay(unixTime);
      const resultDate = DateTime.fromSeconds(result);

      expect(resultDate.month).toBe(2);
      expect(resultDate.day).toBe(1);
    });

    it("should handle year boundary", () => {
      const unixTime = DateTime.fromObject(
        { year: 2023, month: 12, day: 31, hour: 23, minute: 59 },
        { zone: "Europe/Kyiv" },
      ).toSeconds();

      const result = addNextDay(unixTime);
      const resultDate = DateTime.fromSeconds(result);

      expect(resultDate.year).toBe(2024);
      expect(resultDate.month).toBe(1);
      expect(resultDate.day).toBe(1);
    });
  });

  describe("getCurrentUADateTime", () => {
    it("should return current datetime in HH:mm dd.MM.yyyy format", () => {
      const result = getCurrentUADateTime();
      expect(result).toMatch(/^\d{2}:\d{2} \d{2}\.\d{2}\.\d{4}$/);
    });

    it("should use Kyiv timezone", () => {
      const result = getCurrentUADateTime();
      const parsed = parseUaDateTimeSafe(result);
      expect(parsed).toBeInstanceOf(Date);
    });
  });

  describe("toUADayMonthFromUnix", () => {
    it("should format unix timestamp to Ukrainian day month format", () => {
      const unixTime = DateTime.fromObject(
        { year: 2024, month: 3, day: 15 },
        { zone: "Europe/Kyiv" },
      ).toSeconds();

      const result = toUADayMonthFromUnix(unixTime);
      expect(result).toBe("15 березня");
    });

    it("should handle first day of month", () => {
      const unixTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 1 },
        { zone: "Europe/Kyiv" },
      ).toSeconds();

      const result = toUADayMonthFromUnix(unixTime);
      expect(result).toBe("1 січня");
    });

    it("should use Ukrainian locale for month names", () => {
      const unixTime = DateTime.fromObject(
        { year: 2024, month: 12, day: 25 },
        { zone: "Europe/Kyiv" },
      ).toSeconds();

      const result = toUADayMonthFromUnix(unixTime);
      expect(result).toContain("грудня");
    });
  });

  describe("formatUATime", () => {
    it("should format Date object to HH:mm", () => {
      const date = new Date(2024, 2, 15, 14, 30);
      const result = formatUATime(date);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it("should handle midnight", () => {
      const date = new Date(2024, 2, 15, 0, 0);
      const result = formatUATime(date);
      expect(result).toBe("00:00");
    });

    it("should handle single digit hours and minutes with padding", () => {
      const date = new Date(2024, 2, 15, 9, 5);
      const result = formatUATime(date);
      expect(result).toBe("09:05");
    });
  });

  describe("formatUADate", () => {
    it("should format Date object to Ukrainian date format", () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      const result = formatUADate(date);
      expect(result).toBe("15 березня");
    });

    it("should handle different months", () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      const result = formatUADate(date);
      expect(result).toBe("1 січня");
    });

    it("should use Ukrainian locale", () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      const result = formatUADate(date);
      expect(result).toContain("грудня");
    });
  });
});
