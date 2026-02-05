import "dotenv/config";
import { Telegraf } from "telegraf";

import { getOutageScheduleImageBuffer } from "../src/infrastructure/imageService.js";
import { getOutageData } from "../src/services/outageService.js";
import { formatOutageMessage } from "../src/presentation/messageBuilder.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("dtek", async (ctx) => {
  try {
    console.log("DTEK command started");

    await ctx.sendChatAction("typing");

    const [outageData, imageBuffer] = await Promise.all([
      getOutageData(),
      getOutageScheduleImageBuffer(),
    ]);

    const caption = formatOutageMessage(outageData);

    console.log("DTEK command completed, sending response");
    console.log("Caption: \n", caption);

    if (imageBuffer) {
      return ctx.replyWithPhoto({ source: imageBuffer }, { caption, parse_mode: "HTML" });
    } else {
      return ctx.reply(caption, { parse_mode: "HTML" });
    }
  } catch (err) {
    console.error("DTEK command error:", err);
    return ctx.reply("❌ Сталася помилка при отриманні даних");
  }
});

export default async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Disable all caching at HTTP level
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Accel-Expires", "0");

  try {
    await bot.handleUpdate(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Bot handling failed:", err);
    res.status(500).send("Error processing bot handling.");
  }
};
