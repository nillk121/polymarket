import Decimal from 'decimal.js';

/**
 * Тип платежного провайдера
 */
export enum PaymentProviderType {
  TON_WALLET = 'ton_wallet',
  TELEGRAM_WALLET = 'telegram_wallet',
  TELEGRAM_STARS = 'telegram_stars',
}

/**
 * Статус платежа
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Параметры для создания платежа
 */
export interface CreatePaymentParams {
  userId: string;
  walletId: string;
  amount: Decimal;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

/**
 * Результат создания платежа
 */
export interface CreatePaymentResult {
  paymentId: string;
  providerPaymentId: string;
  status: PaymentStatus;
  redirectUrl?: string;
  qrCode?: string;
  deepLink?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Параметры для верификации webhook
 */
export interface WebhookVerificationParams {
  signature: string;
  payload: string | Buffer;
  timestamp?: string;
}

/**
 * Данные webhook
 */
export interface WebhookData {
  providerPaymentId: string;
  status: PaymentStatus;
  amount: Decimal;
  currency: string;
  transactionHash?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Интерфейс платежного провайдера
 */
export interface IPaymentProvider {
  /**
   * Тип провайдера
   */
  readonly type: PaymentProviderType;

  /**
   * Создание платежа
   */
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;

  /**
   * Проверка статуса платежа
   */
  checkPaymentStatus(paymentId: string): Promise<PaymentStatus>;

  /**
   * Верификация webhook
   */
  verifyWebhook(params: WebhookVerificationParams): Promise<boolean>;

  /**
   * Парсинг webhook данных
   */
  parseWebhook(payload: any): Promise<WebhookData>;

  /**
   * Отмена платежа
   */
  cancelPayment(paymentId: string): Promise<boolean>;

  /**
   * Возврат платежа
   */
  refundPayment(paymentId: string, amount?: Decimal): Promise<boolean>;
}


