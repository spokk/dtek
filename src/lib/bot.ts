import { Bot } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";

import { config } from "../config.js";
import { loadBotInfo, cacheBotInfo } from "./botInfo.js";

const botInfo = await loadBotInfo();
const bot = new Bot(config.telegram.botToken, { botInfo });

if (!botInfo) {
  await bot.init();
  await cacheBotInfo(bot.botInfo);
}

bot.api.config.use(autoRetry({ maxRetryAttempts: 3, maxDelaySeconds: 10 }));

export { bot };
