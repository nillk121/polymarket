import { Context } from 'grammy';
import { apiClient } from '../services/api';
import { messages, createMiniAppKeyboard } from '../utils/messages';

/**
 * Обработка команды /start
 * Поддерживает реферальные ссылки: /start ref_XXXXX
 */
export async function handleStart(ctx: Context) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      await ctx.reply(messages.errors.unauthorized);
      return;
    }

    const username = ctx.from?.username || ctx.from?.first_name;
    const commandArgs = ctx.message?.text?.split(' ');

    // Проверка реферального кода
    let referralCode: string | undefined;
    if (commandArgs && commandArgs.length > 1) {
      const refCode = commandArgs[1];
      if (refCode.startsWith('ref_')) {
        referralCode = refCode;
      }
    }

    // Проверка существования пользователя
    let user = await apiClient.getUser(telegramId);

    if (!user && referralCode) {
      // Регистрация с реферальным кодом
      try {
        user = await apiClient.registerUserWithReferral(telegramId, referralCode);
      } catch (error) {
        console.error('Error registering with referral:', error);
      }
    }

    // Отправка приветственного сообщения
    const message = referralCode
      ? messages.startWithReferral(username, referralCode)
      : messages.start(username);

    await ctx.reply(message, {
      reply_markup: createMiniAppKeyboard(),
    });

    // Логирование реферального перехода
    if (referralCode) {
      console.log(`User ${telegramId} registered with referral code: ${referralCode}`);
    }
  } catch (error) {
    console.error('Error in /start command:', error);
    await ctx.reply(messages.errors.generic);
  }
}

