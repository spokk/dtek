import 'dotenv/config';
import { Telegraf } from 'telegraf';

import { CONFIG } from './config.js';
import {
  withRetry,
  fetchDTEKData,
  formatDTEKMessage,
  getHouseDataFromResponse,
  getCurrentDateKyiv
} from './helpers.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('dtek', async (ctx) => {
  try {
    console.log('DTEK command started');

    const currentDate = getCurrentDateKyiv();

    console.log('Current Kyiv date:', currentDate);

    const json = await withRetry(() => fetchDTEKData(currentDate));

    console.log('Retrieved DTEK data:', json);

    const house = getHouseDataFromResponse(json, process.env.DTEK_HOUSE);

    console.log('House data retrieved:', house);

    if (!house) {
      return ctx.reply(CONFIG.MESSAGES.NO_INFO);
    }

    const caption = formatDTEKMessage(house, process.env.DTEK_STREET, currentDate, json?.updateTimestamp);
    const todayImgURL = `${CONFIG.TODAY_IMAGE_URL}?v=${Date.now()}`;

    return ctx.replyWithPhoto(todayImgURL, { caption });
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