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

    // Добавляем кнопку пополнения
    const { InlineKeyboard } = await import('grammy');
    const keyboard = new InlineKeyboard()
      .text('💳 Пополнить баланс', 'deposit:start')
      .row()
      .text('📱 Открыть Mini App', 'open_mini_app:/wallet');

    await ctx.reply(message, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  } catch (error: any) {
    console.error('Error in /balance command:', error);
    
    let errorMessage = messages.balance.error;
    
    // Более детальные сообщения об ошибках
    if (error.response?.status === 502) {
      errorMessage = '❌ Сервер временно недоступен.\n\n' +
        'Проверьте, что бэкенд запущен на порту 3002:\n' +
        '`npm run dev` в папке apps/backend';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = '❌ Не удалось подключиться к серверу.\n\n' +
        'Убедитесь, что бэкенд запущен:\n' +
        '`npm run dev` в папке apps/backend';
    } else if (error.response?.status === 404) {
      errorMessage = '❌ Кошелек не найден.\n\n' +
        'Откройте Mini App для создания кошелька.';
    }
    
    await ctx.reply(errorMessage, {
      parse_mode: 'Markdown',
    });
  }
}

