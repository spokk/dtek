import "dotenv/config";
import { Telegraf } from "telegraf";

import { config } from "../src/config.js";
import { getOutageImage } from "../src/infrastructure/imageService.js";
import { getOutageData } from "../src/services/outageService.js";
import { formatOutageMessage } from "../src/presentation/messageBuilder.js";

/* eslint-disable no-unused-vars */
interface VercelRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  send(body: string): void;
}
/* eslint-enable no-unused-vars */

const bot = new Telegraf(config.telegram.botToken);

bot.command("dtek", async (ctx) => {
  try {
    console.log("DTEK command started");

    await ctx.sendChatAction("typing");

    const outageData = await getOutageData();
    const outageMessage = formatOutageMessage(outageData);
    const image = await getOutageImage(outageData.scheduleData);

    console.log("DTEK command completed, sending response");

    const canUseCaption = image && outageMessage.length < 1024;

    if (canUseCaption) {
      return ctx.replyWithPhoto({ source: image }, { caption: outageMessage, parse_mode: "HTML" });
    }

    if (image) await ctx.replyWithPhoto({ source: image });
    return ctx.reply(outageMessage, { parse_mode: "HTML" });
  } catch (err) {
    console.error("DTEK command error:", err);
    return ctx.reply("❌ Сталася помилка при отриманні даних");
  }
});

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  if (
    !config.telegram.webhookSecret ||
    req.headers["x-telegram-bot-api-secret-token"] !== config.telegram.webhookSecret
  ) {
    return res.status(401).send("Unauthorized");
  }

  try {
    await bot.handleUpdate(req.body as Parameters<typeof bot.handleUpdate>[0]);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Bot handling failed:", err);
    res.status(500).send("Error processing bot handling.");
  }
};
