import { notificationService } from '../index';
import { Market, Bet } from '../services/api';

/**
 * Webhook endpoint для получения уведомлений от backend
 * Этот файл может быть использован для создания HTTP endpoint
 * который будет вызываться из backend при событиях
 */

export interface NewMarketEvent {
  type: 'new_market';
  market: Market;
  userIds?: string[]; // Если не указано, отправляется всем подписанным пользователям
}

export interface MarketResolvedEvent {
  type: 'market_resolved';
  market: Market;
  resolvedOutcomeId: string;
  userIds?: string[];
}

export interface BetWonEvent {
  type: 'bet_won';
  bet: Bet;
  payout: string;
  userId: string;
}

export interface BetLostEvent {
  type: 'bet_lost';
  bet: Bet;
  userId: string;
}

export type NotificationEvent =
  | NewMarketEvent
  | MarketResolvedEvent
  | BetWonEvent
  | BetLostEvent;

/**
 * Обработка события уведомления
 */
export async function handleNotificationEvent(event: NotificationEvent) {
  try {
    switch (event.type) {
      case 'new_market':
        const userIds = event.userIds || await notificationService.getUsersForNotification();
        await notificationService.notifyNewMarket(event.market, userIds);
        break;

      case 'market_resolved':
        const resolvedUserIds = event.userIds || await notificationService.getUsersForNotification();
        await notificationService.notifyMarketResolved(
          event.market,
          event.resolvedOutcomeId,
          resolvedUserIds,
        );
        break;

      case 'bet_won':
        await notificationService.notifyBetWon(event.bet, event.payout, event.userId);
        break;

      case 'bet_lost':
        await notificationService.notifyBetLost(event.bet, event.userId);
        break;

      default:
        console.warn('Unknown notification event type:', event);
    }
  } catch (error) {
    console.error('Error handling notification event:', error);
  }
}

