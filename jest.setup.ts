// Mock environment variables
process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
process.env.TELEGRAM_WEBHOOK_SECRET = "test-webhook-secret";
process.env.DTEK_CSRF_TOKEN = "test-csrf-token";
process.env.DTEK_COOKIE = "test-cookie";
process.env.DTEK_CITY = "test-city";
process.env.DTEK_STREET = "test-street";
process.env.DTEK_HOUSE = "test-house";

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
