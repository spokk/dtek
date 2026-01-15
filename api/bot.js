import 'dotenv/config';
import { Telegraf } from 'telegraf';

import { getCurrentDateKyiv, withRetry, fetchDTEKData, formatDTEKMessage, getHouseDataFromResponse } from './helpers.js';
import { CONFIG } from './config.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('dtek', async (ctx) => {
  try {
    console.log('DTEK command started');
    const currentDate = getCurrentDateKyiv();
    console.log('Current date:', currentDate);

    const json = await withRetry(() => fetchDTEKData(currentDate));

    console.log('Parsed JSON successfully');

    const house = getHouseDataFromResponse(json, process.env.DTEK_HOUSE);

    if (!house) {
      return ctx.reply(CONFIG.MESSAGES.NO_INFO);
    }

    console.log('DTEK command completed successfully');

    const caption = formatDTEKMessage(house, process.env.DTEK_STREET, json?.updateTimestamp);
    const imageUrl = `${CONFIG.IMAGE_URL}?v=${Date.now()}`;

    return ctx.replyWithPhoto(imageUrl, { caption });
  } catch (err) {
    console.error('DTEK command error:', err);

    return ctx.reply(CONFIG.MESSAGES.ERROR);
  }
});

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Bot handling failed:', err);
    res.status(500).send('Error processing bot handling.');
  }
}