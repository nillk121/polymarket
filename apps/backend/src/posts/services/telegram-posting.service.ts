import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Сервис для публикации постов в Telegram каналы
 */
@Injectable()
export class TelegramPostingService {
  private readonly logger = new Logger(TelegramPostingService.name);
  private readonly botToken: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN') || '';
  }

  /**
   * Публикация поста в канал
   */
  async publishPost(
    channelId: string,
    content: string,
    options?: {
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      disableWebPagePreview?: boolean;
      replyMarkup?: any;
    },
  ): Promise<{ messageId: number; success: boolean }> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      const response = await axios.post(url, {
        chat_id: channelId,
        text: content,
        parse_mode: options?.parseMode || 'HTML',
        disable_web_page_preview: options?.disableWebPagePreview ?? false,
        reply_markup: options?.replyMarkup,
      });

      if (response.data.ok) {
        return {
          messageId: response.data.result.message_id,
          success: true,
        };
      } else {
        throw new Error(response.data.description || 'Failed to send message');
      }
    } catch (error: any) {
      this.logger.error(`Error publishing post to channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Редактирование поста в канале
   */
  async editPost(
    channelId: string,
    messageId: number,
    content: string,
    options?: {
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      disableWebPagePreview?: boolean;
      replyMarkup?: any;
    },
  ): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/editMessageText`;

      const response = await axios.post(url, {
        chat_id: channelId,
        message_id: messageId,
        text: content,
        parse_mode: options?.parseMode || 'HTML',
        disable_web_page_preview: options?.disableWebPagePreview ?? false,
        reply_markup: options?.replyMarkup,
      });

      return response.data.ok === true;
    } catch (error: any) {
      this.logger.error(
        `Error editing post in channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Удаление поста из канала
   */
  async deletePost(channelId: string, messageId: number): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/deleteMessage`;

      const response = await axios.post(url, {
        chat_id: channelId,
        message_id: messageId,
      });

      return response.data.ok === true;
    } catch (error: any) {
      this.logger.error(
        `Error deleting post from channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Создание inline клавиатуры с кнопкой Mini App
   */
  createMiniAppButton(text: string, url: string) {
    return {
      inline_keyboard: [
        [
          {
            text,
            web_app: { url },
          },
        ],
      ],
    };
  }
}

