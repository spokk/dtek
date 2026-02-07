export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  },
  dtek: {
    csrfToken: process.env.DTEK_CSRF_TOKEN,
    cookie: process.env.DTEK_COOKIE,
    city: process.env.DTEK_CITY,
    street: process.env.DTEK_STREET,
    house: process.env.DTEK_HOUSE,
  },
  power: {
    cities: process.env.POWER_CITIES ?? "",
    region: process.env.POWER_REGION || "Регіон",
  },
};
