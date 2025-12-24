import Decimal from 'decimal.js';
import { FeeParams } from '../types';

/**
 * Утилиты для расчета комиссий
 */
export class FeeCalculator {
  /**
   * Расчет комиссии от суммы
   * 
   * @param params - Параметры для расчета
   * @returns Комиссия
   */
  static calculate(params: FeeParams): Decimal {
    const { amount, feeRate } = params;

    if (amount.isZero() || feeRate.isZero()) {
      return new Decimal(0);
    }

    // Fee = amount * feeRate
    return amount.times(feeRate);
  }

  /**
   * Расчет суммы после вычета комиссии
   * 
   * @param amount - Исходная сумма
   * @param feeRate - Ставка комиссии (0-1)
   * @returns Сумма после вычета комиссии
   */
  static calculateNetAmount(amount: Decimal, feeRate: Decimal): Decimal {
    const fee = this.calculate({ amount, feeRate });
    return amount.minus(fee);
  }

  /**
   * Расчет суммы с учетом комиссии (для получения нужной суммы после комиссии)
   * 
   * @param netAmount - Желаемая сумма после комиссии
   * @param feeRate - Ставка комиссии (0-1)
   * @returns Сумма с учетом комиссии
   */
  static calculateGrossAmount(netAmount: Decimal, feeRate: Decimal): Decimal {
    if (feeRate.isZero()) {
      return netAmount;
    }

    // grossAmount = netAmount / (1 - feeRate)
    return netAmount.div(new Decimal(1).minus(feeRate));
  }

  /**
   * Валидация ставки комиссии
   * 
   * @param feeRate - Ставка комиссии
   * @returns true если валидна
   */
  static isValidFeeRate(feeRate: Decimal): boolean {
    return feeRate.gte(0) && feeRate.lte(1);
  }
}

