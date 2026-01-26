export const checkImageExists = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch (error) {
    console.error('Error checking image:', error.message);
    return false;
  }
};

export const withRetry = async (fn, maxRetries = 10) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${fn.name} #${attempt} of ${maxRetries}`);
      return await fn();
    } catch (error) {
      console.error(`Error on attempt ${attempt}:`, error.message);
      if (attempt === maxRetries) throw error;

      const delayMs = Math.min(100 * Math.pow(2, attempt - 1), 3000);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};
