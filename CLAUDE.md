# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Telegram bot that reports DTEK Kyiv Region power outage status. Responds to `/dtek` with outage info, schedule images, and regional power stats from Svitlobot. Built with grammY, deployed as a serverless Vercel function (Frankfurt region) via Telegram webhook.

## Commands

- `npm test` — run all tests (Jest + SWC)
- `npx jest path/to/file.test.ts` — run a single test file
- `npm run lint` — ESLint
- `npm run lint:fix` — ESLint with auto-fix
- `npm run format` — lint:fix + Prettier
- `npm run typecheck` — TypeScript type-check (noEmit, SWC handles transpilation)
- `npm run deploy` — deploy to Vercel

## Architecture

`api/bot.ts` is the Vercel serverless entrypoint. It creates a grammY webhook handler (HTTPS adapter) and registers the `/dtek` command. All source code lives in `src/`.

**Data flow for `/dtek` command:**
1. `outageService.getOutageData()` fetches DTEK schedule + Svitlobot power data in parallel via `Promise.allSettled`
2. `messageBuilder.formatOutageMessage()` builds an HTML message for Telegram
3. `imageService.getOutageImage()` generates a schedule grid image using `@vercel/og` (ImageResponse), cached in Upstash Redis (base64, 24h TTL)
4. The bot replies with photo + caption (or separate photo + text if caption > 1024 chars)

**Layer structure:**
- `src/lib/` — Bot instance setup (grammY with auto-retry), Redis client, bot info caching in Redis to avoid `getMe` on cold starts
- `src/infrastructure/` — External API clients: DTEK outage API, Svitlobot power monitoring API, image generation service
- `src/services/` — Business logic: aggregates data from both APIs into `OutageData`
- `src/presentation/` — Message formatting (HTML) and OG image element builders for the schedule table
- `src/utils/` — Date helpers (Luxon, Ukraine timezone), HTTP retry, power stats calculation, HTML escaping

**Key patterns:**
- Bot info is cached in Redis to skip the Telegram `getMe` call on cold starts (`src/lib/botInfo.ts`)
- Inter font is bundled locally in `assets/` (loaded via `readFileSync`) to avoid Google Fonts fetch on cold start
- The DTEK API requires session cookies and CSRF tokens (configured via env vars)
- `withRetry` in `httpClient.ts` wraps API calls with configurable retry counts (DTEK: 10 retries, Svitlobot: 3)
- Svitlobot failure is non-fatal; DTEK failure throws

## Tech Stack

- **Runtime:** Node >= 24, ESM (`"type": "module"`)
- **Bot framework:** grammY with `@grammyjs/auto-retry`
- **Deployment:** Vercel serverless functions
- **Image generation:** `@vercel/og` (satori-based ImageResponse)
- **Cache:** Upstash Redis (`@upstash/redis`)
- **Dates:** Luxon (Ukraine timezone `Europe/Kyiv`)
- **Tests:** Jest with SWC transform, co-located `*.test.ts` files
- **Linting:** ESLint + Prettier, enforced via husky + lint-staged on commit

## Conventions

- TypeScript with strict mode, `nodenext` module resolution
- All imports use `.js` extensions (ESM requirement; Jest remaps via `moduleNameMapper`)
- Tests are co-located next to source files (`foo.test.ts` beside `foo.ts`)
- UI text is in Ukrainian
