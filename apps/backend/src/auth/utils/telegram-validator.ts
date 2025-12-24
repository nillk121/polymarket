import * as crypto from 'crypto';

/**
 * Утилита для валидации Telegram WebApp initData
 */
export class TelegramValidator {
  /**
   * Валидация hash от Telegram WebApp
   * @param initData - Строка initData от Telegram WebApp
   * @param botToken - Токен бота
   * @returns true если hash валиден
   */
  static validateInitData(initData: string, botToken: string): boolean {
    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      
      if (!hash) {
        return false;
      }

      // Удаляем hash из параметров
      urlParams.delete('hash');

      // Создаем data-check-string
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Создаем secret key
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Вычисляем hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return calculatedHash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Парсинг initData строки в объект
   */
  static parseInitData(initData: string): Record<string, string> {
    const params = new URLSearchParams(initData);
    const result: Record<string, string> = {};
    
    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }

  /**
   * Проверка времени auth_date (не старше 24 часов)
   */
  static validateAuthDate(authDate: number): boolean {
    const authDateObj = new Date(authDate * 1000);
    const now = new Date();
    const hoursDiff = (now.getTime() - authDateObj.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  }
}

