import Decimal from 'decimal.js';
import { SlippageParams } from '../types';

/**
 * Утилиты для расчета проскальзывания (slippage)
 * 
 * Проскальзывание - это разница между ожидаемой ценой и фактической ценой исполнения
 * Выражается в процентах
 */
export class SlippageCalculator {
  /**
   * Расчет проскальзывания в процентах
   * 
   * @param params - Параметры для расчета
   * @returns Проскальзывание в процентах (положительное = неблагоприятное)
   */
  static calculate(params: SlippageParams): Decimal {
    const { currentPrice, executionPrice } = params;

    if (currentPrice.isZero()) {
      return new Decimal(0);
    }

    // Slippage = (executionPrice - currentPrice) / currentPrice * 100
    const slippage = executionPrice
      .minus(currentPrice)
      .div(currentPrice)
      .times(100);

    return slippage;
  }

  /**
   * Проверка, превышает ли проскальзывание максимально допустимое значение
   * 
   * @param slippage - Текущее проскальзывание
   * @param maxSlippage - Максимально допустимое проскальзывание (в процентах)
   * @returns true если проскальзывание превышает максимум
   */
  static exceedsMax(slippage: Decimal, maxSlippage: Decimal): boolean {
    return slippage.abs().gt(maxSlippage);
  }

  /**
   * Расчет максимальной цены с учетом проскальзывания
   * 
   * @param currentPrice - Текущая цена
   * @param maxSlippage - Максимально допустимое проскальзывание (в процентах)
   * @returns Максимальная цена
   */
  static calculateMaxPrice(
    currentPrice: Decimal,
    maxSlippage: Decimal,
  ): Decimal {
    // maxPrice = currentPrice * (1 + maxSlippage / 100)
    return currentPrice.times(
      new Decimal(1).plus(maxSlippage.div(100)),
    );
  }

  /**
   * Расчет минимальной цены с учетом проскальзывания
   * 
   * @param currentPrice - Текущая цена
   * @param maxSlippage - Максимально допустимое проскальзывание (в процентах)
   * @returns Минимальная цена
   */
  static calculateMinPrice(
    currentPrice: Decimal,
    maxSlippage: Decimal,
  ): Decimal {
    // minPrice = currentPrice * (1 - maxSlippage / 100)
    return currentPrice.times(
      new Decimal(1).minus(maxSlippage.div(100)),
    );
  }
}

