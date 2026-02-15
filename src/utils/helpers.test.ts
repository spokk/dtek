import {
  getHouseDataFromResponse,
  extractTodayUNIX,
  getHouseGroup,
  getHoursData,
  hasOutagePeriod,
} from "./helpers.js";

describe("helpers", () => {
  describe("getHouseDataFromResponse", () => {
    it("returns house data when valid response and house number exist", () => {
      const dtekResponse = {
        data: {
          123: { name: "House 123", status: "active" },
        },
      } as unknown as import("../types.js").DtekResponse;
      expect(getHouseDataFromResponse(dtekResponse, "123")).toEqual({
        name: "House 123",
        status: "active",
      });
    });

    it("returns null when house number is not in response data", () => {
      const dtekResponse = {
        data: {
          123: { name: "House 123" },
        },
      } as unknown as import("../types.js").DtekResponse;
      expect(getHouseDataFromResponse(dtekResponse, "456")).toBeNull();
    });

    it("returns null when dtekResponse is null", () => {
      expect(getHouseDataFromResponse(null, "123")).toBeNull();
    });

    it("returns null when dtekResponse is undefined", () => {
      expect(getHouseDataFromResponse(undefined, "123")).toBeNull();
    });

    it("returns null when dtekResponse.data is missing", () => {
      const dtekResponse = { other: "data" } as unknown as import("../types.js").DtekResponse;
      expect(getHouseDataFromResponse(dtekResponse, "123")).toBeNull();
    });

    it("returns null when DTEK_HOUSE is not set", () => {
      const dtekResponse = {
        data: {
          123: { name: "House 123" },
        },
      } as unknown as import("../types.js").DtekResponse;
      expect(getHouseDataFromResponse(dtekResponse, undefined)).toBeNull();
    });
  });

  describe("extractTodayUNIX", () => {
    it("returns UNIX timestamp when fact.today is a valid string number", () => {
      const fact = { today: "1704067200" };
      expect(extractTodayUNIX(fact)).toBe(1704067200);
    });

    it("returns UNIX timestamp when fact.today is a valid integer", () => {
      const fact = { today: 1704067200 };
      expect(extractTodayUNIX(fact)).toBe(1704067200);
    });

    it("returns null when fact.today is zero", () => {
      const fact = { today: 0 };
      expect(extractTodayUNIX(fact)).toBeNull();
    });

    it("returns null when fact.today is a negative number", () => {
      const fact = { today: -1704067200 };
      expect(extractTodayUNIX(fact)).toBeNull();
    });

    it("returns null when fact.today is not a number string", () => {
      const fact = { today: "invalid" };
      expect(extractTodayUNIX(fact)).toBeNull();
    });

    it("returns null when fact.today is a float", () => {
      const fact = { today: 1704067200.5 };
      expect(extractTodayUNIX(fact)).toBeNull();
    });

    it("returns null when fact is null", () => {
      expect(extractTodayUNIX(null as unknown as import("../types.js").DtekFact)).toBeNull();
    });

    it("returns null when fact is undefined", () => {
      expect(extractTodayUNIX(undefined as unknown as import("../types.js").DtekFact)).toBeNull();
    });

    it("returns null when fact.today is missing", () => {
      const fact = { other: "data" } as unknown as import("../types.js").DtekFact;
      expect(extractTodayUNIX(fact)).toBeNull();
    });

    it("returns null when fact.today is an empty string", () => {
      const fact = { today: "" };
      expect(extractTodayUNIX(fact)).toBeNull();
    });
  });

  describe("getHouseGroup", () => {
    it("returns group name from preset when reasonKey exists in sch_names", () => {
      const houseData = { sub_type_reason: ["GPV6.1"] };
      const preset = { sch_names: { "GPV6.1": "Черга 6.1" } };
      expect(getHouseGroup(houseData, preset)).toBe("Черга 6.1");
    });

    it("extracts numeric part from reasonKey when not in preset", () => {
      const houseData = { sub_type_reason: ["GPV6.1"] };
      const preset = { sch_names: {} };
      expect(getHouseGroup(houseData, preset)).toBe("6.1");
    });

    it("extracts numeric part from different format", () => {
      const houseData = { sub_type_reason: ["GPV3.2"] };
      const preset = { sch_names: {} };
      expect(getHouseGroup(houseData, preset)).toBe("3.2");
    });

    it("extracts whole number when no decimal", () => {
      const houseData = { sub_type_reason: ["GPV5"] };
      const preset = { sch_names: {} };
      expect(getHouseGroup(houseData, preset)).toBe("5");
    });

    it('returns "Невідомо" when reasonKey has no numbers', () => {
      const houseData = { sub_type_reason: ["GPV"] };
      const preset = { sch_names: {} };
      expect(getHouseGroup(houseData, preset)).toBe("Невідомо");
    });

    it('returns "Невідомо" when preset is null', () => {
      const houseData = { sub_type_reason: [] };
      expect(getHouseGroup(houseData, null)).toBe("Невідомо");
    });

    it('returns "Невідомо" when sub_type_reason is missing', () => {
      const houseData = {};
      const preset = { sch_names: {} };
      expect(getHouseGroup(houseData, preset)).toBe("Невідомо");
    });

    it('returns "Невідомо" when houseData is null', () => {
      const preset = { sch_names: {} };
      expect(getHouseGroup(null, preset)).toBe("Невідомо");
    });

    it('returns "Невідомо" when reasonKey is empty string', () => {
      const houseData = { sub_type_reason: [""] };
      const preset = { sch_names: {} };
      expect(getHouseGroup(houseData, preset)).toBe("Невідомо");
    });
  });

  describe("getHoursData", () => {
    it("returns hours data when all parameters are valid", () => {
      const fact = {
        data: {
          "1704067200": {
            reason_123: { "0": "yes", "1": "no", "2": "yes", "3": "no" } as Record<
              string,
              import("../types.js").HourStatus
            >,
          },
        },
      } as unknown as import("../types.js").DtekFact;
      expect(getHoursData(fact, "reason_123", 1704067200)).toEqual({
        "0": "yes",
        "1": "no",
        "2": "yes",
        "3": "no",
      });
    });

    it("returns undefined when reasonKey does not exist", () => {
      const fact = {
        data: {
          "1704067200": {
            reason_123: { "0": "yes" } as Record<string, import("../types.js").HourStatus>,
          },
        },
      } as unknown as import("../types.js").DtekFact;
      expect(getHoursData(fact, "reason_456", 1704067200)).toBeUndefined();
    });

    it("returns undefined when dayUNIX does not exist", () => {
      const fact = {
        data: {
          "1704067200": {
            reason_123: { "0": "yes" } as Record<string, import("../types.js").HourStatus>,
          },
        },
      } as unknown as import("../types.js").DtekFact;
      expect(getHoursData(fact, "reason_123", 9999999999)).toBeUndefined();
    });

    it("returns undefined when fact is null", () => {
      expect(getHoursData(null, "reason_123", 1704067200)).toBeUndefined();
    });

    it("returns undefined when fact is undefined", () => {
      expect(getHoursData(undefined, "reason_123", 1704067200)).toBeUndefined();
    });

    it("returns undefined when fact.data is missing", () => {
      const fact = { other: "data" } as unknown as import("../types.js").DtekFact;
      expect(getHoursData(fact, "reason_123", 1704067200)).toBeUndefined();
    });

    it("returns empty object when data exists but is empty", () => {
      const fact = {
        data: {
          "1704067200": {
            reason_123: {} as Record<string, import("../types.js").HourStatus>,
          },
        },
      } as unknown as import("../types.js").DtekFact;
      expect(getHoursData(fact, "reason_123", 1704067200)).toEqual({});
    });
  });

  describe("hasOutagePeriod", () => {
    it("returns true when sub_type and start_date are present", () => {
      const houseData = {
        sub_type: "maintenance",
        start_date: "2024-01-01",
      };
      expect(hasOutagePeriod(houseData)).toBe(true);
    });

    it("returns true when sub_type and end_date are present", () => {
      const houseData = {
        sub_type: "maintenance",
        end_date: "2024-01-31",
      };
      expect(hasOutagePeriod(houseData)).toBe(true);
    });

    it("returns true when sub_type, start_date, and end_date are all present", () => {
      const houseData = {
        sub_type: "maintenance",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };
      expect(hasOutagePeriod(houseData)).toBe(true);
    });

    it("returns false when sub_type is missing", () => {
      const houseData = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };
      expect(hasOutagePeriod(houseData)).toBe(false);
    });

    it("returns false when both start_date and end_date are missing", () => {
      const houseData = {
        sub_type: "maintenance",
      };
      expect(hasOutagePeriod(houseData)).toBe(false);
    });

    it("returns false when houseData is null", () => {
      expect(hasOutagePeriod(null)).toBe(false);
    });

    it("returns false when houseData is undefined", () => {
      expect(hasOutagePeriod(undefined)).toBe(false);
    });

    it("returns false when houseData is an empty object", () => {
      expect(hasOutagePeriod({})).toBe(false);
    });

    it("returns false when sub_type is empty string", () => {
      const houseData = {
        sub_type: "",
        start_date: "2024-01-01",
      };
      expect(hasOutagePeriod(houseData)).toBe(false);
    });

    it("returns false when start_date and end_date are empty strings", () => {
      const houseData = {
        sub_type: "maintenance",
        start_date: "",
        end_date: "",
      };
      expect(hasOutagePeriod(houseData)).toBe(false);
    });
  });
});
