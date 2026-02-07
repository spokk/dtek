# AGENTS.md

## Commands
- **Test all:** `npm test`
- **Test single file:** `npx jest src/utils/dateUtils.test.js`
- **Lint:** `npm run lint` | **Fix:** `npm run lint:fix`
- **Format:** `npm run format` (eslint fix + prettier)
- **Deploy:** `npm run deploy` (Vercel)

## Architecture
Telegram bot (Telegraf) deployed as a Vercel serverless function (`api/bot.js`).
- `src/infrastructure/` — External API clients (DTEK, Svitlobot) and image service
- `src/services/` — Business logic (outage data aggregation with retry)
- `src/presentation/` — Message formatting and formatters for Telegram output (HTML)
- `src/utils/` — Shared helpers (dates via Luxon, HTTP retry, HTML escaping, power stats)

## Code Style
- ES Modules (`"type": "module"`), Node 24. Use `.js` extensions in imports.
- Prettier: 100 char printWidth. ESLint with recommended rules + prettier plugin.
- Tests: Jest + SWC transform. Co-locate tests as `*.test.js` next to source files.
- Named exports preferred. Async/await for all async code. `console.error` for errors.
- Ukrainian language in user-facing bot messages.
