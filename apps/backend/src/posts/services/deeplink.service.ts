import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Сервис для генерации deep links к Mini App
 */
@Injectable()
export class DeeplinkService {
  private readonly miniAppUrl: string;

  constructor(private configService: ConfigService) {
    this.miniAppUrl = this.configService.get('MINI_APP_URL') || 'https://your-mini-app.com';
  }

  /**
   * Генерация deep link к рынку
   */
  generateMarketLink(marketId: string, source?: string): string {
    const url = new URL(`${this.miniAppUrl}/markets/${marketId}`);
    
    if (source) {
      url.searchParams.set('source', source);
    }

    return url.toString();
  }

  /**
   * Генерация deep link к списку рынков
   */
  generateMarketsLink(source?: string): string {
    const url = new URL(`${this.miniAppUrl}/markets`);
    
    if (source) {
      url.searchParams.set('source', source);
    }

    return url.toString();
  }

  /**
   * Генерация deep link к кошельку
   */
  generateWalletLink(source?: string): string {
    const url = new URL(`${this.miniAppUrl}/wallet`);
    
    if (source) {
      url.searchParams.set('source', source);
    }

    return url.toString();
  }

  /**
   * Генерация Telegram Mini App deep link
   * Формат: https://t.me/your_bot/your_app?startapp=...
   */
  generateTelegramMiniAppLink(path: string, params?: Record<string, string>): string {
    const botUsername = this.configService.get('TELEGRAM_BOT_USERNAME') || 'your_bot';
    const url = new URL(`https://t.me/${botUsername}/${path}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Извлечение параметров из deep link
   */
  parseDeeplink(url: string): { path: string; params: Record<string, string> } {
    const parsedUrl = new URL(url);
    const params: Record<string, string> = {};
    
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return {
      path: parsedUrl.pathname,
      params,
    };
  }
}

