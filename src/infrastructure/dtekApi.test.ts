import { fetchDTEKOutageData } from "./dtekApi.js";

const testDtekConfig = {
  csrfToken: "test-csrf-token",
  cookie: "test-cookie",
  city: "test-city",
  street: "test-street",
  house: "test-house",
};

const mockSuccessResponse = (body = { status: "ok" }) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
});

const mockErrorResponse = (status = 500) => ({
  ok: false,
  status,
  statusText: "Internal Server Error",
  text: jest.fn(),
});

beforeEach(() => {
  global.fetch = jest.fn() as jest.Mock;
});

describe("fetchDTEKOutageData", () => {
  it("makes POST request with correct URL, headers, and body params", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse());

    await fetchDTEKOutageData("12:00 01.01.2025", testDtekConfig);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://www.dtek-krem.com.ua/ua/ajax");
    expect(options.method).toBe("POST");
    expect(options.headers["x-csrf-token"]).toBe("test-csrf-token");
    expect(options.headers.Cookie).toBe("test-cookie");
    expect(options.headers["x-requested-with"]).toBe("XMLHttpRequest");
    expect(options.headers["content-type"]).toBe(
      "application/x-www-form-urlencoded; charset=UTF-8",
    );

    const body = new URLSearchParams(options.body);
    expect(body.get("method")).toBe("getHomeNum");
    expect(body.get("data[0][name]")).toBe("city");
    expect(body.get("data[0][value]")).toBe("test-city");
    expect(body.get("data[1][name]")).toBe("street");
    expect(body.get("data[1][value]")).toBe("test-street");
  });

  it("returns parsed JSON on success", async () => {
    const data = { fact: { today: "1234567890" } };
    (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse(data));

    const result = await fetchDTEKOutageData("12:00 01.01.2025", testDtekConfig);

    expect(result).toEqual(data);
  });

  it("throws on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse(500));

    await expect(fetchDTEKOutageData("12:00 01.01.2025", testDtekConfig)).rejects.toThrow(
      "DTEK API returned error: 500",
    );
  });

  it("passes currentDate in the body as updateFact value", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockSuccessResponse());

    await fetchDTEKOutageData("18:30 15.06.2025", testDtekConfig);

    const body = new URLSearchParams((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.get("data[2][name]")).toBe("updateFact");
    expect(body.get("data[2][value]")).toBe("18:30 15.06.2025");
  });

  it("throws on invalid JSON response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: jest.fn().mockResolvedValue("not valid json{"),
    });

    await expect(fetchDTEKOutageData("12:00 01.01.2025", testDtekConfig)).rejects.toThrow();
  });
});
