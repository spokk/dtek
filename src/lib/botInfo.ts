import type { UserFromGetMe } from "grammy/types";

import { redis } from "./redis.js";

const BOT_INFO_CACHE_KEY = "bot-info";

export async function loadBotInfo(): Promise<UserFromGetMe | undefined> {
  try {
    const cached = await redis.get<UserFromGetMe>(BOT_INFO_CACHE_KEY);
    if (cached) {
      console.log("Bot info loaded from Redis cache");
      return cached;
    }
  } catch (err) {
    console.error("Failed to load bot info from Redis:", err);
  }
  return undefined;
}

export async function cacheBotInfo(botInfo: UserFromGetMe): Promise<void> {
  try {
    await redis.set(BOT_INFO_CACHE_KEY, botInfo);
    console.log("Bot info cached in Redis");
  } catch (err) {
    console.error("Failed to cache bot info:", err);
  }
}
