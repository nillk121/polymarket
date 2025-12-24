import {
  IPaymentProvider,
  PaymentProviderType,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentStatus,
  WebhookVerificationParams,
  WebhookData,
} from '../interfaces/payment-provider.interface';
import Decimal from 'decimal.js';

/**
 * Базовый класс для платежных провайдеров
 */
export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract readonly type: PaymentProviderType;

  // Абстрактные методы, которые должны быть реализованы в дочерних классах
  abstract createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  abstract checkPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  abstract verifyWebhook(params: WebhookVerificationParams): Promise<boolean>;
  abstract parseWebhook(payload: any): Promise<WebhookData>;
  abstract cancelPayment(paymentId: string): Promise<boolean>;
  abstract refundPayment(paymentId: string, amount?: Decimal): Promise<boolean>;

  /**
   * Валидация суммы
   */
  protected validateAmount(amount: any): void {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
  }

  /**
   * Валидация валюты
   */
  protected validateCurrency(currency: string): void {
    if (!currency || currency.length !== 3) {
      throw new Error('Invalid currency');
    }
  }
}
