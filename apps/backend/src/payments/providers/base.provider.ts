import { IPaymentProvider, PaymentProviderType } from '../interfaces/payment-provider.interface';

/**
 * Базовый класс для платежных провайдеров
 */
export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract readonly type: PaymentProviderType;

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


