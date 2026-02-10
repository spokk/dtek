# AGENTS.md

## Commands

- **Test all:** `npm test`
- **Test single file:** `npx jest src/utils/dateUtils.test.js`
- **Lint:** `npm run lint` | **Fix:** `npm run lint:fix`
- **Format:** `npm run format` (eslint fix + prettier)
- **Deploy:** `npm run deploy` (Vercel)

## Architecture

Telegram bot (Telegraf) deployed as a Vercel serverless function (`api/bot.js`).

- `src/config.js` — Environment variable validation and app configuration
- `src/lib/` — Shared clients and infrastructure wiring
  - `redis.js` — Upstash Redis client instance
- `src/infrastructure/` — External API clients (`dtekApi.js`, `svitlobotApi.js`) and image generation service (`imageService.js` using `@vercel/og`)
- `src/services/` — Business logic (`outageService.js`: outage data aggregation, schedule extraction with retry)
- `src/presentation/` — Telegram output layer
  - `messageBuilder.js` — Top-level message assembly
  - `outageTableImage.js` — Satori/OG-compatible element tree for outage schedule images
  - `formatters/` — Individual formatters (`outageFormatter.js`, `scheduleFormatter.js`) for HTML output
- `src/utils/` — Shared helpers
  - `dateUtils.js` — Date formatting via Luxon
  - `httpClient.js` — HTTP fetch with retry logic
  - `escapeHtml.js` — HTML escaping for Telegram messages
  - `helpers.js` — DTEK response data extraction utilities
  - `powerUtils.js` — Power statistics helpers

## Code Style

- ES Modules (`"type": "module"`), Node 24. Use `.js` extensions in imports.
- Prettier: 100 char printWidth. ESLint with recommended rules + prettier plugin.
- Tests: Jest 30 + SWC transform. Co-locate tests as `*.test.js` next to source files.
- Named exports preferred. Async/await for all async code. `console.error` for errors.
- Ukrainian language in user-facing bot messages.
