export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 10,
  functionName: string = "Unknown",
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${functionName}] Attempt #${attempt} of ${maxRetries}`);
      return await fn();
    } catch (error) {
      console.error(`[${functionName}] Error on attempt ${attempt}:`, (error as Error).message);
      if (attempt === maxRetries) throw error;

      const delayMs = Math.min(100 * Math.pow(2, attempt - 1), 1600);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("unreachable");
};
