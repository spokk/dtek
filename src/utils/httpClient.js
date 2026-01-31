export const withRetry = async (fn, maxRetries = 10, functionName = "Unknown") => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${functionName}] Attempt #${attempt} of ${maxRetries}`);
      return await fn();
    } catch (error) {
      console.error(`[${functionName}] Error on attempt ${attempt}:`, error.message);
      if (attempt === maxRetries) throw error;

      const delayMs = Math.min(100 * Math.pow(2, attempt - 1), 1600);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};
