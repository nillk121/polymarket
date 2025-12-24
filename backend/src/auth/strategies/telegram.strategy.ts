import { Injectable } from '@nestjs/common';

/**
 * Telegram Strategy для валидации данных Telegram WebApp
 * В production здесь должна быть проверка hash от Telegram
 * через crypto.createHmac('sha256', botToken)
 */
@Injectable()
export class TelegramStrategy {
  /**
   * Валидация данных Telegram WebApp
   * @param authData Данные от Telegram WebApp
   * @returns Валидированные данные пользователя
   */
  async validate(authData: any): Promise<any> {
    // В production здесь должна быть проверка hash от Telegram
    // Пример:
    // const hash = authData.hash;
    // const dataCheckString = Object.keys(authData)
    //   .filter(key => key !== 'hash')
    //   .sort()
    //   .map(key => `${key}=${authData[key]}`)
    //   .join('\n');
    // const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
    // const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    // if (calculatedHash !== hash) throw new UnauthorizedException();
    
    return authData;
  }
}

