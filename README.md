# dtekbot

Telegram bot that reports power outage status for DTEK Kyiv Region. Responds to the `/dtek` command with current outage info, schedule graphs, and regional power statistics from [Svitlobot](https://svitlobot.in.ua).

Deployed as a serverless Vercel function, triggered via Telegram webhook.

## Architecture

```
api/bot.ts                  ← Vercel entrypoint, Telegram webhook handler
src/
  config.ts                 ← Environment variable validation and app configuration
  types.ts                  ← Shared TypeScript type definitions
  lib/                      ← Shared clients (Redis)
  infrastructure/           ← External API clients (DTEK, Svitlobot, schedule image)
  services/                 ← Business logic (outage data aggregation)
  presentation/             ← Message formatting (HTML for Telegram)
  utils/                    ← Date, HTTP, power stats, HTML escaping helpers
```

## Setup

1. **Clone and install**

   ```sh
   git clone https://github.com/spokk/dtek.git
   cd dtek
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in the values:

   | Variable                   | Description                                             |
   | -------------------------- | ------------------------------------------------------- |
   | `TELEGRAM_BOT_TOKEN`       | Bot token from [@BotFather](https://t.me/BotFather)     |
   | `TELEGRAM_WEBHOOK_SECRET`  | Secret for validating incoming webhook requests         |
   | `DTEK_COOKIE`              | Session cookie for DTEK API                             |
   | `DTEK_CSRF_TOKEN`          | CSRF token for DTEK API                                 |
   | `DTEK_CITY`                | City ID for DTEK lookup                                 |
   | `DTEK_STREET`              | Street name for DTEK lookup                             |
   | `DTEK_HOUSE`               | House identifier in DTEK response                       |
   | `POWER_CITIES`             | Comma-separated city names for Svitlobot regional stats |
   | `POWER_REGION`             | Display name for the region in stats                    |
   | `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST API URL                              |
   | `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token                            |

3. **Deploy**

   ```sh
   npm run deploy
   ```

4. **Set Telegram webhook** pointing to `https://<your-vercel-url>/api/bot` with the secret token.

## Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `npm test`           | Run tests (Jest)                |
| `npm run lint`       | Lint with ESLint                |
| `npm run format`     | Fix lint + format with Prettier |
| `npm run typecheck`  | Type-check with TypeScript      |
| `npm run deploy`     | Deploy to Vercel                |

## License

[MIT](LICENSE)
