import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';

/**
 * Сервис для расчета выплат с учетом комиссий
 */
@Injectable()
export class PayoutCalculationService {
  /**
   * Расчет выплаты для выигравшей ставки
   * 
   * @param betShares - Количество акций ставки
   * @param betPrice - Цена покупки акций
   * @param betCost - Общая стоимость ставки
   * @param feeRate - Комиссия платформы (например, 0.05 = 5%)
   * @returns Объект с расчетами выплаты
   */
  calculatePayout(
    betShares: Decimal,
    betPrice: Decimal,
    betCost: Decimal,
    feeRate: Decimal = new Decimal(0.05), // 5% по умолчанию
  ): {
    grossPayout: Decimal; // Выплата до вычета комиссии
    fee: Decimal; // Комиссия
    netPayout: Decimal; // Выплата после вычета комиссии
  } {
    // Для выигравшей ставки типа BUY:
    // - Пользователь купил shares акций по цене price
    // - При разрешении рынка, каждая акция стоит 1 единицу валюты
    // - Gross payout = shares * 1 = shares
    // - Fee = grossPayout * feeRate
    // - Net payout = grossPayout - fee

    const grossPayout = betShares; // Каждая акция стоит 1 при разрешении
    const fee = grossPayout.times(feeRate);
    const netPayout = grossPayout.minus(fee);

    return {
      grossPayout,
      fee,
      netPayout,
    };
  }

  /**
   * Расчет выплаты для ставки типа SELL (короткая позиция)
   * 
   * @param betShares - Количество проданных акций
   * @param sellRevenue - Выручка от продажи
   * @param feeRate - Комиссия платформы
   * @returns Объект с расчетами выплаты
   */
  calculateSellPayout(
    betShares: Decimal,
    sellRevenue: Decimal,
    feeRate: Decimal = new Decimal(0.05),
  ): {
    grossPayout: Decimal;
    fee: Decimal;
    netPayout: Decimal;
  } {
    // Для выигравшей ставки типа SELL:
    // - Пользователь продал shares акций и получил sellRevenue
    // - При разрешении рынка, если исход НЕ выиграл, пользователь получает sellRevenue
    // - Gross payout = sellRevenue (уже получено при продаже)
    // - Fee = sellRevenue * feeRate
    // - Net payout = sellRevenue - fee

    const grossPayout = sellRevenue;
    const fee = grossPayout.times(feeRate);
    const netPayout = grossPayout.minus(fee);

    return {
      grossPayout,
      fee,
      netPayout,
    };
  }

  /**
   * Расчет выплаты для проигравшей ставки (возврат части средств)
   * 
   * @param betCost - Стоимость ставки
   * @param refundRate - Процент возврата (например, 0.1 = 10%)
   * @returns Объект с расчетами возврата
   */
  calculateRefund(
    betCost: Decimal,
    refundRate: Decimal = new Decimal(0.1), // 10% возврат по умолчанию
  ): {
    refundAmount: Decimal;
  } {
    // Для проигравшей ставки возвращаем часть средств
    const refundAmount = betCost.times(refundRate);

    return {
      refundAmount,
    };
  }

  /**
   * Валидация суммы выплаты
   */
  validatePayoutAmount(amount: Decimal): void {
    if (amount.isNegative() || amount.isZero()) {
      throw new Error('Payout amount must be positive');
    }
  }
}

