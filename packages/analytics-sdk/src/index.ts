import { EventType, AnalyticsEvent } from '@polymarket/shared-types';

export interface AnalyticsConfig {
  apiUrl: string;
  apiKey?: string;
}

export interface TrackEventOptions {
  userId?: string;
  marketId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralCode?: string;
}

export class AnalyticsSDK {
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  /**
   * Отправка события аналитики
   */
  async trackEvent(
    eventType: EventType,
    options: TrackEventOptions = {},
  ): Promise<AnalyticsEvent | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({
          eventType,
          ...options,
        }),
      });

      if (!response.ok) {
        console.error('Failed to track event:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data as AnalyticsEvent;
    } catch (error) {
      console.error('Error tracking event:', error);
      return null;
    }
  }

  /**
   * Трекинг просмотра рынка
   */
  trackMarketView(marketId: string, options?: TrackEventOptions): Promise<AnalyticsEvent | null> {
    return this.trackEvent(EventType.MARKET_VIEW, {
      ...options,
      marketId,
    });
  }

  /**
   * Трекинг создания заказа
   */
  trackOrderPlace(
    marketId: string,
    orderId: string,
    amount: number,
    options?: TrackEventOptions,
  ): Promise<AnalyticsEvent | null> {
    return this.trackEvent(EventType.ORDER_PLACE, {
      ...options,
      marketId,
      metadata: {
        orderId,
        amount,
      },
    });
  }

  /**
   * Трекинг завершения заказа
   */
  trackOrderComplete(
    marketId: string,
    orderId: string,
    amount: number,
    options?: TrackEventOptions,
  ): Promise<AnalyticsEvent | null> {
    return this.trackEvent(EventType.ORDER_COMPLETE, {
      ...options,
      marketId,
      metadata: {
        orderId,
        amount,
      },
    });
  }

  /**
   * Трекинг регистрации пользователя
   */
  trackUserRegister(userId: string, options?: TrackEventOptions): Promise<AnalyticsEvent | null> {
    return this.trackEvent(EventType.USER_REGISTER, {
      ...options,
      userId,
    });
  }

  /**
   * Трекинг входа пользователя
   */
  trackUserLogin(userId: string, options?: TrackEventOptions): Promise<AnalyticsEvent | null> {
    return this.trackEvent(EventType.USER_LOGIN, {
      ...options,
      userId,
    });
  }

  /**
   * Трекинг клика по реферальной ссылке
   */
  trackReferralClick(
    referralCode: string,
    options?: TrackEventOptions,
  ): Promise<AnalyticsEvent | null> {
    return this.trackEvent(EventType.REFERRAL_CLICK, {
      ...options,
      referralCode,
    });
  }
}

/**
 * Создание экземпляра AnalyticsSDK
 */
export function createAnalyticsSDK(config: AnalyticsConfig): AnalyticsSDK {
  return new AnalyticsSDK(config);
}

