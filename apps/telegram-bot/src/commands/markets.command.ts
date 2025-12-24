import { Context } from 'grammy';
import { apiClient } from '../services/api';
import { messages, createMiniAppKeyboard } from '../utils/messages';

/**
 * Обработка команды /markets
 */
export async function handleMarkets(ctx: Context) {
  try {
    const marketsData = await apiClient.getMarkets({
      status: 'active',
      limit: 10,
    });

    const message = messages.markets.list(marketsData.markets);

    await ctx.reply(message, {
      reply_markup: createMiniAppKeyboard('/markets'),
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Error in /markets command:', error);
    await ctx.reply(messages.markets.error);
  }
}

