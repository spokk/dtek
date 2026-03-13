import "dotenv/config";
import { InputFile, webhookCallback } from "grammy";

import { config } from "../src/config.js";
import { bot } from "../src/lib/bot.js";
import { getOutageImage } from "../src/infrastructure/imageService.js";
import { getOutageData } from "../src/services/outageService.js";
import { formatOutageMessage } from "../src/presentation/messageBuilder.js";

bot.command("dtek", async (ctx) => {
  try {
    console.log("DTEK command started");

    ctx.replyWithChatAction("typing").catch(() => {});

    const outageData = await getOutageData();
    const outageMessage = formatOutageMessage(outageData);
    const image = await getOutageImage(outageData.scheduleData);

    console.log("DTEK command completed, sending response");

    const canUseCaption = image && outageMessage.length < 1024;

    if (canUseCaption) {
      return ctx.replyWithPhoto(new InputFile(image), {
        caption: outageMessage,
        parse_mode: "HTML",
      });
    }

    if (image) await ctx.replyWithPhoto(new InputFile(image));
    return ctx.reply(outageMessage, { parse_mode: "HTML" });
  } catch (err) {
    console.error("DTEK command error:", err);
    return ctx.reply("❌ Сталася помилка при отриманні даних");
  }
});

bot.catch((err) => {
  console.error("Unhandled bot error:", err);
});

export default webhookCallback(bot, "https", {
  secretToken: config.telegram.webhookSecret,
});
