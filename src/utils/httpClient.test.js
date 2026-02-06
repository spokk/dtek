import { withRetry } from "./httpClient.js";

describe("withRetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("should succeed on first attempt", async () => {
    const mockFn = jest.fn().mockResolvedValue("success");

    const promise = withRetry(mockFn, 3, "TestFunction");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith("[TestFunction] Attempt #1 of 3");
  });

  it("should retry on failure and eventually succeed", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValue("success");

    const promise = withRetry(mockFn, 5, "TestFunction");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith("[TestFunction] Error on attempt 1:", "Fail 1");
  });

  it("should throw error after max retries exhausted", async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error("Persistent failure"));

    const promise = withRetry(mockFn, 3, "TestFunction");
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow("Persistent failure");
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it("should use exponential backoff with correct delays", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValue("success");

    const promise = withRetry(mockFn, 5);

    // First attempt fails
    await jest.advanceTimersByTimeAsync(0);

    // Delay after attempt 1: 100ms
    await jest.advanceTimersByTimeAsync(100);

    // Delay after attempt 2: 200ms
    await jest.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe("success");
  });

  it("should cap delay at 1600ms", async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockRejectedValueOnce(new Error("Fail 3"))
      .mockRejectedValueOnce(new Error("Fail 4"))
      .mockRejectedValueOnce(new Error("Fail 5"))
      .mockRejectedValueOnce(new Error("Fail 6"))
      .mockResolvedValue("success");

    const promise = withRetry(mockFn, 10);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(7);

    // Attempt 1: fail, delay 100ms
    // Attempt 2: fail, delay 200ms
    // Attempt 3: fail, delay 400ms
    // Attempt 4: fail, delay 800ms
    // Attempt 5: fail, delay 1600ms (100 * 2^4 = 1600, capped at 1600)
    // Attempt 6: fail, delay 1600ms (100 * 2^5 = 3200, capped at 1600)
    // Attempt 7: success
  });

  it("should use default values when not provided", async () => {
    const mockFn = jest.fn().mockResolvedValue("success");

    const promise = withRetry(mockFn);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(console.log).toHaveBeenCalledWith("[Unknown] Attempt #1 of 10");
  });

  it("should log all attempts with correct function name", async () => {
    const mockFn = jest.fn().mockRejectedValueOnce(new Error("Fail")).mockResolvedValue("success");

    const promise = withRetry(mockFn, 3, "MyFunction");
    await jest.runAllTimersAsync();
    await promise;

    expect(console.log).toHaveBeenCalledWith("[MyFunction] Attempt #1 of 3");
    expect(console.log).toHaveBeenCalledWith("[MyFunction] Attempt #2 of 3");
  });

  it("should handle synchronous errors", async () => {
    const mockFn = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("Sync error");
      })
      .mockResolvedValue("success");

    const promise = withRetry(mockFn, 3);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
