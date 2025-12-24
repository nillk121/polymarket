import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MarketsService } from '../markets/markets.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class TelegramService {
  private botToken: string;
  private apiUrl: string;

  constructor(
    private configService: ConfigService,
    private marketsService: MarketsService,
    private analyticsService: AnalyticsService,
  ) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(
    chatId: string,
    text: string,
    options?: {
      replyMarkup?: any;
      parseMode?: 'HTML' | 'Markdown';
    },
  ) {
    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode,
        reply_markup: options?.replyMarkup,
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка отправки сообщения в Telegram:', error);
      throw error;
    }
  }

  async sendMarketToChannel(
    channelId: string,
    marketId: string,
  ): Promise<number> {
    const market = await this.marketsService.findOne(marketId);

    const text = this.formatMarketMessage(market);
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '📊 Открыть рынок',
            web_app: { url: `${process.env.FRONTEND_URL}/markets/${marketId}` },
          },
        ],
      ],
    };

    const result = await this.sendMessage(channelId, text, {
      parseMode: 'HTML',
      replyMarkup,
    });

    // Сохраняем ID сообщения в базе данных
    // TODO: Обновить market.telegramMessageId

    return result.message_id;
  }

  private formatMarketMessage(market: any): string {
    const outcomes = market.outcomes
      .map(
        (o: any) =>
          `  • ${o.title}: <b>${(o.probability * 100).toFixed(1)}%</b>`,
      )
      .join('\n');

    return `
🎯 <b>${market.title}</b>

${market.description}

📈 <b>Исходы:</b>
${outcomes}

💰 Ликвидность: ${market.liquidity} TON
📅 ${market.endDate ? `До ${new Date(market.endDate).toLocaleDateString('ru-RU')}` : 'Без ограничений'}
    `.trim();
  }

  async handleWebhook(update: any) {
    if (update.message) {
      await this.handleMessage(update.message);
    }
  }

  private async handleMessage(message: any) {
    // Обработка команд бота
    if (message.text?.startsWith('/')) {
      const command = message.text.split(' ')[0];
      const chatId = message.chat.id.toString();

      switch (command) {
        case '/start':
          await this.sendMessage(
            chatId,
            'Добро пожаловать в платформу прогнозных рынков! 🎯\n\nИспользуйте Mini App для торговли.',
          );
          break;
      }
    }
  }
}

