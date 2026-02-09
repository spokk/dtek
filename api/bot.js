import "dotenv/config";
import { Telegraf } from "telegraf";

import { config } from "../src/config.js";
import { getOutageImages } from "../src/infrastructure/imageService.js";
import { getOutageData } from "../src/services/outageService.js";
import { formatOutageMessage } from "../src/presentation/messageBuilder.js";

const bot = new Telegraf(config.telegram.botToken);

bot.command("dtek", async (ctx) => {
  try {
    console.log("DTEK command started");

    await ctx.sendChatAction("typing");

    const outageData = await getOutageData();
    const outageMessage = formatOutageMessage(outageData);
    const { todayImage, tomorrowImage } = await getOutageImages(outageData.scheduleData);

    console.log("DTEK command completed, sending response");
    console.log("Caption: \n", outageMessage);

    for (const image of [todayImage, tomorrowImage].filter(Boolean)) {
      await ctx.replyWithPhoto({ source: image });
    }

    return ctx.reply(outageMessage, { parse_mode: "HTML" });
  } catch (err) {
    console.error("DTEK command error:", err);
    return ctx.reply("❌ Сталася помилка при отриманні даних");
  }
});

export default async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  if (
    !config.telegram.webhookSecret ||
    req.headers["x-telegram-bot-api-secret-token"] !== config.telegram.webhookSecret
  ) {
    return res.status(401).send("Unauthorized");
  }

  try {
    await bot.handleUpdate(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Bot handling failed:", err);
    res.status(500).send("Error processing bot handling.");
  }
};
