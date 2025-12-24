import { Context, NextFunction } from 'grammy';
import { apiClient } from '../services/api';

/**
 * Middleware для отслеживания реферальных переходов
 */
export async function referralMiddleware(ctx: Context, next: NextFunction) {
  // Обработка реферальных ссылок в командах
  if (ctx.message?.text) {
    const text = ctx.message.text;
    const refMatch = text.match(/ref_([a-zA-Z0-9]+)/);

    if (refMatch) {
      const referralCode = refMatch[0];
      const telegramId = ctx.from?.id.toString();

      if (telegramId) {
        try {
          // Сохранение реферального кода в контексте
          ctx.referralCode = referralCode;

          // Логирование реферального перехода
          console.log(`Referral link clicked: ${referralCode} by user ${telegramId}`);
        } catch (error) {
          console.error('Error processing referral:', error);
        }
      }
    }
  }

  await next();
}

// Расширение типа Context для хранения referralCode
declare module 'grammy' {
  interface Context {
    referralCode?: string;
  }
}

