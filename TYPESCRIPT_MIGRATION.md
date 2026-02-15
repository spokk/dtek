# TypeScript Migration Plan

## Codebase Assessment

**Current state:** 20 source files (10 `.js` + 10 `.test.js`), ~1,200 lines of code total.  
**Architecture:** Clean layered architecture (utils → infrastructure → services → presentation → api entry point).  
**Test coverage:** Every module has co-located tests using Jest + SWC.  
**Build:** ESM (`"type": "module"`), SWC for Jest transform, Vercel serverless deployment.

### File Inventory

| Layer          | Source Files                                                                    | Test Files                                             |
| -------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Entry          | `api/bot.js`                                                                    | —                                                      |
| Config         | `src/config.js`                                                                 | —                                                      |
| Lib            | `src/lib/redis.js`                                                              | —                                                      |
| Infrastructure | `dtekApi.js`, `svitlobotApi.js`, `imageService.js`                              | `dtekApi.test.js`, `svitlobotApi.test.js`              |
| Services       | `outageService.js`                                                              | `outageService.test.js`                                |
| Presentation   | `messageBuilder.js`, `outageTableImage.js`                                      | `messageBuilder.test.js`                               |
| Formatters     | `outageFormatter.js`, `scheduleFormatter.js`                                    | `outageFormatter.test.js`, `scheduleFormatter.test.js` |
| Utils          | `dateUtils.js`, `escapeHtml.js`, `helpers.js`, `httpClient.js`, `powerUtils.js` | all have `.test.js`                                    |

---

## Migration Strategy: Bottom-Up, File-by-File

Migrate leaf modules first (no internal dependencies), then work upward. Each file is renamed `.js` → `.ts` (or `.test.ts`) and typed in one commit. Tests pass after each step.

---

## Phase 0 — Tooling Setup

1. **Install TypeScript + type packages**

   ```bash
   npm i -D typescript @types/node @types/luxon
   ```

   Telegraf, @upstash/redis, and @vercel/og ship their own types.

2. **Create `tsconfig.json`**

   ```jsonc
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "outDir": "dist",
       "rootDir": ".",
       "declaration": true,
       "sourceMap": true,
       "noEmit": true, // Type-checking only; SWC handles transpilation
     },
     "include": ["src/**/*.ts", "api/**/*.ts"],
     "exclude": ["node_modules", "dist", "coverage"],
   }
   ```

3. **Update `.swcrc`** — switch parser to TypeScript:

   ```json
   {
     "jsc": {
       "parser": {
         "syntax": "typescript"
       },
       "target": "es2022"
     },
     "module": {
       "type": "commonjs"
     }
   }
   ```

4. **Update `jest.config.mjs`** — transform `.ts` files:

   ```js
   transform: {
     "^.+\\.tsx?$": "@swc/jest",
   },
   moduleFileExtensions: ["ts", "js", "json"],
   ```

5. **Update `jest.setup.js` → `jest.setup.ts`**

6. **Update `eslint.config.js`** — add `typescript-eslint`:

   ```bash
   npm i -D typescript-eslint
   ```

   Update file globs from `**/*.js` to `**/*.{js,ts}`.

7. **Update `package.json` scripts** — add type-check:

   ```json
   "typecheck": "tsc --noEmit"
   ```

8. **Update `lint-staged`** glob to include `.ts`.

9. **Verify:** `npm test` still passes (no files changed yet).

---

## Phase 1 — Types Definition File (`src/types.ts`)

Create shared type definitions extracted from the codebase's implicit shapes:

```typescript
// src/types.ts

// === Config ===
export interface TelegramConfig {
  botToken: string;
  webhookSecret: string;
}

export interface DtekConfig {
  csrfToken: string;
  cookie: string;
  city: string;
  street: string;
  house: string;
}

export interface PowerConfig {
  cities: string;
  region: string;
}

export interface AppConfig {
  telegram: TelegramConfig;
  dtek: DtekConfig;
  power: PowerConfig;
}

// === DTEK API Response ===
export type HourStatus = "yes" | "no" | "maybe" | "first" | "second" | "mfirst" | "msecond";

export type HoursData = Record<string, HourStatus>;

export interface HouseData {
  sub_type?: string;
  sub_type_reason?: string[];
  start_date?: string;
  end_date?: string;
  [key: string]: unknown;
}

export interface DtekFact {
  today?: string | number;
  data?: Record<number, Record<string, HoursData>>;
}

export interface DtekPreset {
  sch_names?: Record<string, string>;
  time_type?: Record<string, string>;
}

export interface DtekResponse {
  fact: DtekFact;
  preset: DtekPreset;
  data?: Record<string, HouseData>;
  updateTimestamp?: string;
}

// === Schedule ===
export interface ScheduleData {
  todayUNIX: number;
  tomorrowUNIX: number;
  reasonKey: string;
  preset: DtekPreset;
  hoursDataToday: HoursData | undefined;
  hoursDataTomorrow: HoursData | undefined;
}

// === Power ===
export interface PowerRow {
  city: string;
  address: string | null;
  timestamp: Date | null;
  peopleCount: number | null;
  lightStatus: number | null;
  lat: number | null;
  lon: number | null;
  raw: string;
}

export interface PowerStats {
  region: string;
  lightPercent: number;
}

// === Outage Data (service output) ===
export interface OutageData {
  dtekResponse: DtekResponse;
  houseData: HouseData | null;
  scheduleData: ScheduleData | null;
  powerStats: PowerStats | null;
  currentDate: string;
}

// === Presentation ===
export interface MessageData {
  houseGroup: string;
  house: HouseData | null;
  currentDate: string;
  scheduleBlocks: string[];
  powerStats: PowerStats | null;
  updateTimestamp?: string;
}

export interface TimeSegment {
  from: string;
  to: string;
  status: string;
}
```

---

## Phase 2 — Utils (leaf modules, no internal deps)

Migrate in any order (no dependencies between them):

| #   | File                  | Key changes                                                           |
| --- | --------------------- | --------------------------------------------------------------------- |
| 2a  | `escapeHtml.js → .ts` | Type `text` param as `unknown`, return `string`                       |
| 2b  | `httpClient.js → .ts` | Generic `withRetry<T>(fn: () => Promise<T>, ...)`                     |
| 2c  | `dateUtils.js → .ts`  | Type all params/returns. `parseUaDateTimeSafe` returns `Date \| null` |
| 2d  | `helpers.js → .ts`    | Import `DtekResponse`, `DtekFact`, `HouseData` types                  |
| 2e  | `powerUtils.js → .ts` | Type `parsePowerRow` return as `PowerRow \| null`                     |

**After each:** rename corresponding `.test.js → .test.ts`, fix import extensions, run `npm test`.

---

## Phase 3 — Lib & Config

| #   | File                     | Key changes                                                                       |
| --- | ------------------------ | --------------------------------------------------------------------------------- |
| 3a  | `src/config.js → .ts`    | Type export as `AppConfig`. Env vars cast to `string` (non-null after validation) |
| 3b  | `src/lib/redis.js → .ts` | Just rename — `@upstash/redis` has native types                                   |

---

## Phase 4 — Infrastructure

| #   | File                    | Key changes                                                                               |
| --- | ----------------------- | ----------------------------------------------------------------------------------------- |
| 4a  | `dtekApi.js → .ts`      | `fetchDTEKOutageData(currentDate: string, dtekConfig: DtekConfig): Promise<DtekResponse>` |
| 4b  | `svitlobotApi.js → .ts` | Return `Promise<PowerRow[]>`                                                              |
| 4c  | `imageService.js → .ts` | Type `getOutageImage(scheduleData: ScheduleData \| null): Promise<Buffer \| null>`        |

---

## Phase 5 — Presentation

| #   | File                         | Key changes                                                                    |
| --- | ---------------------------- | ------------------------------------------------------------------------------ |
| 5a  | `outageTableImage.js → .ts`  | Type the `el()` helper, `HoursData` params, export image dimensions as `const` |
| 5b  | `scheduleFormatter.js → .ts` | `TimeSegment` type, `buildScheduleBlocks` typed returns                        |
| 5c  | `outageFormatter.js → .ts`   | `MessageData` param types on formatters                                        |
| 5d  | `messageBuilder.js → .ts`    | `formatOutageMessage(outageData: OutageData): string`                          |

---

## Phase 6 — Services

| #   | File                     | Key changes                                                        |
| --- | ------------------------ | ------------------------------------------------------------------ |
| 6a  | `outageService.js → .ts` | All functions typed with `OutageData`, `ScheduleData` return types |

---

## Phase 7 — Entry Point

| #   | File                  | Key changes                                                                                                                                               |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7a  | `api/bot.js → .ts`    | Type Vercel handler `(req: VercelRequest, res: VercelResponse)`. Import `@vercel/node` types. Update `vercel.json` if needed (Vercel auto-detects `.ts`). |
| 7b  | `jest.setup.js → .ts` | Simple rename                                                                                                                                             |

---

## Phase 8 — Cleanup & Strictness

1. Enable remaining strict flags in `tsconfig.json`:
   ```jsonc
   "noUncheckedIndexedAccess": true,
   "noUnusedLocals": true,
   "noUnusedParameters": true,
   "exactOptionalPropertyTypes": true
   ```
2. Remove all `any` types introduced during migration (search for `any`).
3. Update `eslint.config.js` to use `typescript-eslint/recommended-type-checked`.
4. Update `AGENTS.md` — change code style from `.js` to `.ts`, update file descriptions.
5. Delete this migration plan file.

---

## Deployment Considerations

- **Vercel**: Supports `.ts` serverless functions natively (uses SWC internally). No build step needed — just rename `api/bot.js` → `api/bot.ts`.
- **No `dist/` output**: Keep `noEmit: true` — SWC handles runtime transpilation for tests, Vercel handles deployment.
- **Import extensions**: With `"moduleResolution": "NodeNext"`, imports must use `.js` extension even for `.ts` files (e.g., `import { config } from '../src/config.js'`). This is the Node.js ESM convention and works correctly.

---

## Estimated Effort

| Phase                    | Files         | Effort       |
| ------------------------ | ------------- | ------------ |
| Phase 0 (Tooling)        | config files  | ~30 min      |
| Phase 1 (Types)          | 1 new file    | ~30 min      |
| Phase 2 (Utils)          | 10 files      | ~1 hour      |
| Phase 3 (Lib/Config)     | 2 files       | ~15 min      |
| Phase 4 (Infrastructure) | 6 files       | ~45 min      |
| Phase 5 (Presentation)   | 8 files       | ~1 hour      |
| Phase 6 (Services)       | 2 files       | ~30 min      |
| Phase 7 (Entry)          | 2 files       | ~15 min      |
| Phase 8 (Cleanup)        | all           | ~30 min      |
| **Total**                | **~31 files** | **~5 hours** |
