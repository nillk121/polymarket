import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';
import {
  IPaymentProvider,
  PaymentProviderType,
  PaymentStatus,
  CreatePaymentParams,
  CreatePaymentResult,
  WebhookVerificationParams,
  WebhookData,
} from '../interfaces/payment-provider.interface';
import { BasePaymentProvider } from './base.provider';
import * as crypto from 'crypto';

/**
 * Telegram Wallet Provider
 * 
 * Документация: https://core.telegram.org/bots/payments
 */
@Injectable()
export class TelegramWalletProvider extends BasePaymentProvider implements IPaymentProvider {
  readonly type = PaymentProviderType.TELEGRAM_WALLET;
  
  private readonly botToken: string;
  private readonly webhookSecret: string;
  private readonly providerToken: string; // Токен платежного провайдера

  constructor(private configService: ConfigService) {
    super();
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN') || '';
    this.webhookSecret = this.configService.get('TELEGRAM_WALLET_WEBHOOK_SECRET') || '';
    this.providerToken = this.configService.get('TELEGRAM_WALLET_PROVIDER_TOKEN') || '';
  }

  /**
   * Создание платежа через Telegram Wallet
   */
  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    this.validateAmount(params.amount);
    this.validateCurrency(params.currency);

    const paymentId = crypto.randomUUID();
    const providerPaymentId = `tg_wallet_${Date.now()}_${paymentId}`;

    // Telegram Wallet использует invoice для платежей
    // В реальной реализации здесь будет вызов Telegram Bot API
    // Для демонстрации возвращаем данные для создания invoice

    return {
      paymentId,
      providerPaymentId,
      status: PaymentStatus.PENDING,
      metadata: {
        invoiceId: providerPaymentId,
        providerToken: this.providerToken,
        // Данные для создания invoice через Telegram Bot API
        invoiceData: {
          title: params.description || 'Payment',
          description: params.description || 'Payment via Telegram Wallet',
          payload: paymentId,
          currency: params.currency,
          prices: [
            {
              label: params.description || 'Payment',
              amount: params.amount.times(100).toNumber(), // Telegram использует центы/копейки
            },
          ],
        },
      },
    };
  }

  /**
   * Проверка статуса платежа
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // В реальной реализации запрос к Telegram Bot API
    return PaymentStatus.PENDING;
  }

  /**
   * Верификация webhook от Telegram
   */
  async verifyWebhook(params: WebhookVerificationParams): Promise<boolean> {
    if (!this.webhookSecret) {
      return true;
    }

    try {
      // Telegram использует HMAC-SHA256 для подписи
      const dataCheckString = typeof params.payload === 'string' 
        ? params.payload 
        : JSON.stringify(params.payload);
      
      const signature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(dataCheckString)
        .digest('hex');

      return signature === params.signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Парсинг webhook данных от Telegram
   */
  async parseWebhook(payload: any): Promise<WebhookData> {
    // Структура webhook от Telegram Bot API
    const amount = new Decimal(payload.total_amount || 0).div(100); // Конвертация из центов
    const currency = payload.currency || 'USD';

    return {
      providerPaymentId: payload.invoice_payload || payload.id,
      status: this.mapTelegramStatus(payload.status),
      amount,
      currency,
      transactionHash: payload.telegram_payment_charge_id,
      timestamp: new Date(payload.date || Date.now() * 1000),
      metadata: {
        ...payload,
      },
    };
  }

  /**
   * Отмена платежа
   */
  async cancelPayment(paymentId: string): Promise<boolean> {
    // Telegram Wallet не поддерживает отмену после создания invoice
    return true;
  }

  /**
   * Возврат платежа
   */
  async refundPayment(paymentId: string, amount?: Decimal): Promise<boolean> {
    // Реализация возврата через Telegram Bot API
    // В реальной реализации здесь будет запрос к API
    return false;
  }

  /**
   * Маппинг статуса Telegram в наш статус
   */
  private mapTelegramStatus(telegramStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      successful: PaymentStatus.COMPLETED,
      failed: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
    };

    return statusMap[telegramStatus?.toLowerCase()] || PaymentStatus.PENDING;
  }
}


