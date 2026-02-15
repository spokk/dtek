// === Vercel ===
export interface VercelRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

/* eslint-disable no-unused-vars */
export interface VercelResponse {
  status(code: number): VercelResponse;
  send(body: string): void;
}
/* eslint-enable no-unused-vars */

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
  data?: Record<string, Record<string, HoursData>>;
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
  hoursDataToday?: HoursData;
  hoursDataTomorrow?: HoursData;
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

// === OG Image ===
export interface OgElement {
  type: string;
  props: Record<string, unknown>;
}

export interface SolidStatusDef {
  bg: string;
  label: string;
  textColor: string;
}

export interface SplitStatusDef {
  split: "green-first" | "red-first";
}

export type StatusDef = SolidStatusDef | SplitStatusDef;

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
