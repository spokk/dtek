# AGENTS.md

## Commands

- **Test all:** `npm test`
- **Test single file:** `npx jest src/utils/dateUtils.test.ts`
- **Lint:** `npm run lint` | **Fix:** `npm run lint:fix`
- **Format:** `npm run format` (eslint fix + prettier)
- **Type-check:** `npm run typecheck`
- **Deploy:** `npm run deploy` (Vercel)

## Architecture

Telegram bot (Telegraf) deployed as a Vercel serverless function (`api/bot.ts`).

- `src/config.ts` — Environment variable validation and app configuration
- `src/types.ts` — Shared TypeScript type definitions
- `src/lib/` — Shared clients and infrastructure wiring
  - `redis.ts` — Upstash Redis client instance
- `src/infrastructure/` — External API clients (`dtekApi.ts`, `svitlobotApi.ts`) and image generation service (`imageService.ts` using `@vercel/og`)
- `src/services/` — Business logic (`outageService.ts`: outage data aggregation, schedule extraction with retry)
- `src/presentation/` — Telegram output layer
  - `messageBuilder.ts` — Top-level message assembly
  - `outageTableImage.ts` — Satori/OG-compatible element tree for outage schedule images
  - `formatters/` — Individual formatters (`outageFormatter.ts`, `scheduleFormatter.ts`) for HTML output
- `src/utils/` — Shared helpers
  - `dateUtils.ts` — Date formatting via Luxon
  - `httpClient.ts` — HTTP fetch with retry logic
  - `escapeHtml.ts` — HTML escaping for Telegram messages
  - `helpers.ts` — DTEK response data extraction utilities
  - `powerUtils.ts` — Power statistics helpers

## Code Style

- TypeScript with ES Modules (`"type": "module"`), Node 24. Use `.ts` extensions for source, `.js` extensions in runtime imports.
- Prettier: 100 char printWidth. ESLint with recommended rules + prettier plugin.
- Tests: Jest 30 + SWC transform. Co-locate tests as `*.test.ts` next to source files.
- Named exports preferred. Async/await for all async code. `console.error` for errors.
- Ukrainian language in user-facing bot messages.
