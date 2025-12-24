import { Bot } from 'grammy';
import { apiClient, Bet, Market } from './api';
import { messages, createMiniAppKeyboard } from '../utils/messages';

export class NotificationService {
  private bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  /**
   * Отправка уведомления о новом рынке
   */
  async notifyNewMarket(market: Market, userIds: string[]) {
    const message = messages.notifications.newMarket(market);

    for (const userId of userIds) {
      try {
        await this.bot.api.sendMessage(parseInt(userId), message, {
          reply_markup: createMiniAppKeyboard(`/markets/${market.id}`),
          parse_mode: 'HTML',
        });
      } catch (error) {
        console.error(`Error sending new market notification to ${userId}:`, error);
      }
    }
  }

  /**
   * Отправка уведомления о разрешении рынка
   */
  async notifyMarketResolved(market: Market, outcomeId: string, userIds: string[]) {
    const outcome = market.outcomes.find((o) => o.id === outcomeId);
    if (!outcome) {
      return;
    }

    const message = messages.notifications.marketResolved(market, outcome);

    for (const userId of userIds) {
      try {
        await this.bot.api.sendMessage(parseInt(userId), message, {
          reply_markup: createMiniAppKeyboard('/wallet'),
          parse_mode: 'HTML',
        });
      } catch (error) {
        console.error(`Error sending market resolved notification to ${userId}:`, error);
      }
    }
  }

  /**
   * Отправка уведомления о выигрыше ставки
   */
  async notifyBetWon(bet: Bet, payout: string, userId: string) {
    const message = messages.notifications.betWon(bet, payout);

    try {
      await this.bot.api.sendMessage(parseInt(userId), message, {
        reply_markup: createMiniAppKeyboard('/wallet'),
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(`Error sending bet won notification to ${userId}:`, error);
    }
  }

  /**
   * Отправка уведомления о проигрыше ставки
   */
  async notifyBetLost(bet: Bet, userId: string) {
    const message = messages.notifications.betLost(bet);

    try {
      await this.bot.api.sendMessage(parseInt(userId), message, {
        reply_markup: createMiniAppKeyboard('/markets'),
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(`Error sending bet lost notification to ${userId}:`, error);
    }
  }

  /**
   * Получение списка пользователей для уведомлений
   * В реальной реализации здесь будет запрос к БД
   */
  async getUsersForNotification(): Promise<string[]> {
    // В реальной реализации здесь будет запрос к API для получения списка пользователей
    // которые подписаны на уведомления
    return [];
  }
}

