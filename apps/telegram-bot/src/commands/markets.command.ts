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
  } catch (error: any) {
    console.error('Error in /markets command:', error);
    
    let errorMessage = messages.markets.error;
    
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
      errorMessage = '❌ Рынки не найдены.\n\n' +
        'Попробуйте позже или создайте рынки через админ панель.';
    }
    
    await ctx.reply(errorMessage, {
      parse_mode: 'Markdown',
    });
  }
}

