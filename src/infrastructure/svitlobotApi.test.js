import { fetchSvitlobotOutageData } from "./svitlobotApi.js";
import { parsePowerRow } from "../utils/powerUtils.js";

jest.mock("../utils/powerUtils.js", () => ({
  parsePowerRow: jest.fn(() => ({ city: "Test" })),
}));

const SVITLO_API_URL = "https://api.svitlobot.in.ua/website/getChannelsForMap";

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("fetchSvitlobotOutageData", () => {
  it("makes GET request to the correct URL", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve("row1"),
    });

    await fetchSvitlobotOutageData();

    expect(global.fetch).toHaveBeenCalledWith(
      SVITLO_API_URL,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns parsed and filtered data on success", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve("row1\nrow2\nrow3"),
    });

    const result = await fetchSvitlobotOutageData();

    expect(parsePowerRow).toHaveBeenCalledTimes(3);
    expect(parsePowerRow.mock.calls[0][0]).toBe("row1");
    expect(parsePowerRow.mock.calls[1][0]).toBe("row2");
    expect(parsePowerRow.mock.calls[2][0]).toBe("row3");
    expect(result).toEqual([{ city: "Test" }, { city: "Test" }, { city: "Test" }]);
  });

  it("throws on non-ok response", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    await expect(fetchSvitlobotOutageData()).rejects.toThrow("Svitlobot API HTTP error 503");
  });

  it("filters out null results from parsePowerRow", async () => {
    parsePowerRow
      .mockReturnValueOnce({ city: "Kyiv" })
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ city: "Lviv" });

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve("row1\nrow2\nrow3"),
    });

    const result = await fetchSvitlobotOutageData();

    expect(result).toEqual([{ city: "Kyiv" }, { city: "Lviv" }]);
  });

  it("handles empty response text", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve("  \n  "),
    });

    parsePowerRow.mockReturnValue(null);

    const result = await fetchSvitlobotOutageData();

    expect(result).toEqual([]);
  });
});
