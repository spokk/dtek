# DTEK Bot - AI Coding Assistant Instructions

## Project Overview

**dtekbot** is a Telegram bot that delivers real-time power outage schedules for Kyiv, Ukraine. It queries the DTEK electricity company API and formats outage information for specific addresses.

**Architecture**: Serverless Node.js function (Vercel) → Telegram Bot API (webhook) → DTEK API (HTTP POST)

## Key Components & Data Flow

### 1. **Entry Point** ([api/bot.js](api/bot.js))

- Handles `/dtek` command from Telegram users
- Orchestrates the complete workflow: fetch → extract → format → respond
- Returns either a photo with caption (if image available) or text-only message
- All errors caught at top level and return `CONFIG.MESSAGES.ERROR`

### 2. **Data Fetching** ([api/request.js](api/request.js))

- **`fetchDTEKCurrentInfo()`**: Makes POST requests to `https://www.dtek-krem.com.ua/ua/ajax` with strict headers (mimics Chrome 142)
- Authentication via environment variables: `DTEK_CSRF_TOKEN`, `DTEK_COOKIE`, plus `DTEK_CITY` and `DTEK_STREET`
- Sends parameters as `URLSearchParams` with structure: `data[0][name]/[value]`, `data[1][name]/[value]`, etc.
- **Critical**: CSRF token, cookies, and User-Agent headers must match DTEK's expectations—API rejects stale headers

### 3. **Data Transformation** ([api/helpers.js](api/helpers.js))

- **`fetchDTEKData()`**: Fetches + parses JSON response, throws on non-OK status
- **`getHouseDataFromResponse()`**: Extracts house-specific data from API response using `DTEK_HOUSE` env var
- Validates response structure; throws descriptive error if `data` field missing
- Re-exported from `utils/` for cleaner imports

### 4. **Message Formatting** ([api/utils/messageFormatter.js](api/utils/messageFormatter.js))

- **Two message types**:
  1. **No outage**: Shows daily + tomorrow's schedule preview
  2. **Outage active**: Shows address, start/end times, time elapsed, time remaining, + schedule preview
- Schedule parsing: Converts DTEK hourly data to readable blocks (e.g., "14:00 – 14:30 — без світла")
- **Schedule merging logic**: Adjacent segments with same status are merged into single time ranges
- Handles edge cases: missing `fact.today`, invalid UNIX timestamps, missing schedule data

### 5. **Utilities**

- **[dateUtils.js](api/utils/dateUtils.js)**: All Kyiv timezone operations (always use `Europe/Kyiv`)
  - `parseKyivDateString()`: Handles flexible "DD.MM.YYYY HH:MM" or "HH:MM DD.MM.YYYY" format
  - Time difference shown in Ukrainian (дн/год/хв)
  - `getCurrentDateKyiv()`: Returns current time in Kyiv timezone
- **[httpClient.js](api/utils/httpClient.js)**:
  - `withRetry()`: Exponential backoff (100ms → 3s max), 10 attempts default
  - `checkImageExists()`: HEAD request to validate image URL before sending to Telegram

## Configuration & Environment Variables

[api/config.js](api/config.js) defines static DTEK API settings. Must-have `.env` variables:

```
TELEGRAM_BOT_TOKEN=<from BotFather>
DTEK_CSRF_TOKEN=<manual extraction from DTEK site>
DTEK_COOKIE=<session cookie from DTEK site>
DTEK_HOUSE=<house ID in DTEK API response, e.g., "123456">
DTEK_CITY=<city name, e.g., "Kyiv">
DTEK_STREET=<street address>
```

## Critical Patterns & Conventions

1. **Error Handling**: Never let exceptions bubble up—catch at handler level and return user-facing message from `CONFIG.MESSAGES`
2. **Timezone**: Every date operation must use Kyiv timezone; hardcode `'Europe/Kyiv'` in `toLocaleString()` calls
3. **API Response Validation**: Check for `data` field existence before accessing—API structure is fragile
4. **Retry Strategy**: Use `withRetry()` wrapper for all DTEK API calls; exponential backoff built-in
5. **Message Construction**: Build multi-line messages with `\n\n` (double newline) for sections; use bullet points (`•`) for schedules
6. **DTEK API Headers**: Keep exact User-Agent, sec-\* headers, Referer in sync with [config.js](api/config.js)—DTEK may reject requests with outdated headers

## Development & Deployment

- **Framework**: [Telegraf](https://github.com/telegraf/telegraf) (Telegram bot library)
- **Entry Point**: `api/bot.js` exports default serverless handler → auto-deployed to Vercel
- **Deploy**: `npm run deploy` → Vercel CLI with `--prod` flag
- **Node**: v24+ required (ES modules, fetch API)
- **Logging**: Heavy console.log use for debugging; keep them for production (Vercel logs visible)

## Common Modifications

- **Add new command**: Add new `bot.command('name', async (ctx) => {...})` block in [api/bot.js](api/bot.js)
- **Change message format**: Edit `formatDTEKMessage()` or its helper functions in [api/utils/messageFormatter.js](api/utils/messageFormatter.js)
- **Adjust retry behavior**: Change `withRetry()` call in [api/bot.js](api/bot.js) or default in [httpClient.js](api/utils/httpClient.js)
- **Add schedule parsing rules**: Modify `formatScheduleText()` segment logic in [api/utils/messageFormatter.js](api/utils/messageFormatter.js)
