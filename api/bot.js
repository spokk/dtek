import 'dotenv/config';
import { Telegraf } from 'telegraf';

import { checkImageExists, withRetry } from './utils/httpClient.js';
import { formatDTEKMessage } from './utils/messageFormatter.js';
import { getCurrentDateKyiv } from './utils/dateUtils.js';

import { CONFIG } from './config.js';
import { fetchDTEKData, getHouseDataFromResponse } from './helpers.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('dtek', async (ctx) => {
  try {
    console.log('DTEK command started');

    const currentDate = getCurrentDateKyiv();

    console.log('Current Kyiv date:', currentDate);

    const dtekResponse = await withRetry(() => fetchDTEKData(currentDate));

    console.log('Retrieved DTEK data:', JSON.stringify(dtekResponse, null, 2));

    const houseData = getHouseDataFromResponse(dtekResponse, process.env.DTEK_HOUSE);

    console.log('House data retrieved:', JSON.stringify(houseData, null, 2));

    if (!houseData) {
      return ctx.reply(CONFIG.MESSAGES.NO_INFO);
    }

    const caption = formatDTEKMessage(dtekResponse, houseData, process.env.DTEK_STREET, currentDate);
    const todayImgURL = `${CONFIG.TODAY_IMAGE_URL}?v=${Date.now()}`;

    const imageExists = await checkImageExists(todayImgURL);

    if (imageExists) {
      return ctx.replyWithPhoto(todayImgURL, { caption });
    } else {
      return ctx.reply(caption);
    }
  } catch (err) {
    console.error('DTEK command error:', err);

    return ctx.reply(CONFIG.MESSAGES.ERROR);
  }
});

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // Disable all caching at HTTP level
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Accel-Expires', '0');

  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Bot handling failed:', err);
    res.status(500).send('Error processing bot handling.');
  }
}