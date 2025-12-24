import { Context } from 'grammy';
import { apiClient } from '../services/api';
import { messages, createMiniAppKeyboard } from '../utils/messages';

/**
 * Обработка команды /balance
 */
export async function handleBalance(ctx: Context) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      await ctx.reply(messages.errors.unauthorized);
      return;
    }

    const balance = await apiClient.getUserBalance(telegramId);

    if (!balance) {
      await ctx.reply(messages.balance.noWallet, {
        reply_markup: createMiniAppKeyboard('/wallet'),
      });
      return;
    }

    const message = messages.balance.show(balance);

    await ctx.reply(message, {
      reply_markup: createMiniAppKeyboard('/wallet'),
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Error in /balance command:', error);
    await ctx.reply(messages.balance.error);
  }
}

