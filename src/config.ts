import type { AppConfig } from "./types.js";

const REQUIRED_ENV_VARS = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "DTEK_CSRF_TOKEN",
  "DTEK_COOKIE",
  "DTEK_CITY",
  "DTEK_STREET",
  "DTEK_HOUSE",
];

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

export const config: AppConfig = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET!,
  },
  dtek: {
    csrfToken: process.env.DTEK_CSRF_TOKEN!,
    cookie: process.env.DTEK_COOKIE!,
    city: process.env.DTEK_CITY!,
    street: process.env.DTEK_STREET!,
    house: process.env.DTEK_HOUSE!,
  },
  power: {
    cities: process.env.POWER_CITIES ?? "",
    region: process.env.POWER_REGION || "Регіон",
  },
};
