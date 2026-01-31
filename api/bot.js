import "dotenv/config";
import { Telegraf } from "telegraf";

import { checkImageExists } from "./utils/httpClient.js";
import { fetchOutageData, getTodayImageURL } from "./services/outageService.js";
import { formatOutageMessage } from "./utils/messageFormatter.js";

import { CONFIG } from "./config.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command("dtek", async (ctx) => {
  try {
    console.log("DTEK command started");

    await ctx.sendChatAction("find_location");

    const { dtekResponse, houseData, powerStats, currentDate } =
      await fetchOutageData();

    const caption = formatOutageMessage(
      dtekResponse,
      houseData,
      currentDate,
      powerStats,
    );
    const todayImgURL = getTodayImageURL();

    const imageExists = await checkImageExists(todayImgURL);

    console.log("DTEK command completed, sending response");
    console.log("Caption: \n", caption);

    if (imageExists) {
      return ctx.replyWithPhoto(todayImgURL, { caption, parse_mode: "HTML" });
    } else {
      return ctx.reply(caption, { parse_mode: "HTML" });
    }
  } catch (err) {
    console.error("DTEK command error:", err);
    return ctx.reply(CONFIG.MESSAGES.ERROR);
  }
});

export default async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Disable all caching at HTTP level
  res.setHeader(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, max-age=0",
  );
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
