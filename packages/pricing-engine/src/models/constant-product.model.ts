import Decimal from 'decimal.js';
import {
  MarketState,
  OutcomeState,
  PriceCalculationParams,
  PriceCalculationResult,
  BetType,
} from '../types';

/**
 * Constant Product Pricing Model (Uniswap-style)
 * 
 * Математическая формула:
 * 
 * Для каждого исхода i поддерживается резерв R_i
 * Инвариант: Π(R_i) = k (константа)
 * 
 * Цена исхода i:
 * p_i = R_i / Σ(R_j)
 * 
 * При покупке x акций исхода i:
 * - R_i увеличивается на x
 * - Инвариант должен сохраниться
 * - Стоимость = изменение в других резервах
 * 
 * Формула для покупки:
 * (R_i + x) * (R_j - ΔR_j) = R_i * R_j
 * 
 * Для множественных исходов:
 * Π(R_k) = k (до покупки)
 * Π(R_k + δ_ik * x - δ_jk * ΔR_j) = k (после покупки)
 */
export class ConstantProductModel {
  /**
   * Расчет текущей цены исхода
   * 
   * @param marketState - Состояние рынка
   * @param outcomeId - ID исхода
   * @returns Цена исхода (0-1)
   */
  static calculatePrice(
    marketState: MarketState,
    outcomeId: string,
  ): Decimal {
    const { outcomes } = marketState;

    // В Constant Product модели резервы = shares
    const totalReserves = outcomes.reduce(
      (sum, outcome) => sum.plus(outcome.shares),
      new Decimal(0),
    );

    if (totalReserves.isZero()) {
      // Если резервы равны нулю, возвращаем равномерное распределение
      return new Decimal(1).div(outcomes.length);
    }

    const outcome = outcomes.find((o) => o.id === outcomeId);
    if (!outcome) {
      throw new Error(`Outcome ${outcomeId} not found in market`);
    }

    // Цена = резерв исхода / сумма всех резервов
    return outcome.shares.div(totalReserves);
  }

  /**
   * Расчет стоимости покупки акций
   * 
   * @param marketState - Текущее состояние рынка
   * @param outcomeId - ID исхода
   * @param shares - Количество акций для покупки
   * @returns Стоимость покупки
   */
  static calculateBuyCost(
    marketState: MarketState,
    outcomeId: string,
    shares: Decimal,
  ): Decimal {
    const { outcomes } = marketState;

    if (shares.isZero()) {
      return new Decimal(0);
    }

    // Находим исход для покупки
    const buyOutcomeIndex = outcomes.findIndex((o) => o.id === outcomeId);
    if (buyOutcomeIndex === -1) {
      throw new Error(`Outcome ${outcomeId} not found in market`);
    }

    // Вычисляем произведение всех резервов (инвариант k)
    const k = outcomes.reduce(
      (product, outcome) => product.times(outcome.shares.gt(0) ? outcome.shares : new Decimal(1)),
      new Decimal(1),
    );

    if (k.isZero() || k.isNaN()) {
      throw new Error('Invalid market state: constant product is zero or NaN');
    }

    // Новый резерв для покупаемого исхода
    const newBuyReserve = outcomes[buyOutcomeIndex].shares.plus(shares);

    // Вычисляем новый инвариант для остальных исходов
    // k_new = (R_i + x) * Π(R_j) для j != i
    // Но нам нужно найти, сколько нужно заплатить
    // 
    // Для упрощения: используем формулу для двух исходов и расширяем
    // Для binary рынка: (R1 + x) * (R2 - cost) = R1 * R2
    // cost = R2 - (R1 * R2) / (R1 + x)
    
    if (outcomes.length === 2) {
      // Binary рынок - простая формула
      const otherOutcomeIndex = buyOutcomeIndex === 0 ? 1 : 0;
      const otherReserve = outcomes[otherOutcomeIndex].shares;
      const buyReserve = outcomes[buyOutcomeIndex].shares;

      if (otherReserve.isZero()) {
        throw new Error('Other outcome has zero reserve');
      }

      // cost = R2 - (R1 * R2) / (R1 + x)
      const cost = otherReserve.minus(
        buyReserve.times(otherReserve).div(newBuyReserve),
      );

      return cost.gt(0) ? cost : new Decimal(0);
    } else {
      // Multi рынок - более сложная формула
      // Используем итеративный подход
      // Для каждого другого исхода вычисляем изменение резерва
      
      let totalCost = new Decimal(0);
      const otherOutcomes = outcomes.filter((_, index) => index !== buyOutcomeIndex);
      
      // Распределяем стоимость пропорционально резервам других исходов
      const totalOtherReserves = otherOutcomes.reduce(
        (sum, outcome) => sum.plus(outcome.shares),
        new Decimal(0),
      );

      if (totalOtherReserves.isZero()) {
        throw new Error('All other outcomes have zero reserves');
      }

      // Вычисляем новый инвариант
      const newK = newBuyReserve.times(
        otherOutcomes.reduce(
          (product, outcome) => product.times(outcome.shares.gt(0) ? outcome.shares : new Decimal(1)),
          new Decimal(1),
        ),
      );

      // Находим новые резервы для других исходов, сохраняя пропорции
      for (const outcome of otherOutcomes) {
        const proportion = outcome.shares.div(totalOtherReserves);
        // Новый резерв должен быть таким, чтобы k_new = (R_i + x) * Π(R_j_new)
        // Упрощенный расчет: уменьшаем пропорционально
        const newReserve = outcome.shares.minus(
          outcome.shares.times(shares).div(newBuyReserve),
        );
        const cost = outcome.shares.minus(newReserve);
        totalCost = totalCost.plus(cost.gt(0) ? cost : new Decimal(0));
      }

      return totalCost;
    }
  }

  /**
   * Расчет выручки от продажи акций
   * 
   * @param marketState - Текущее состояние рынка
   * @param outcomeId - ID исхода
   * @param shares - Количество акций для продажи
   * @returns Выручка от продажи
   */
  static calculateSellRevenue(
    marketState: MarketState,
    outcomeId: string,
    shares: Decimal,
  ): Decimal {
    const { outcomes } = marketState;

    if (shares.isZero()) {
      return new Decimal(0);
    }

    // Проверяем, что у пользователя достаточно акций
    const sellOutcome = outcomes.find((o) => o.id === outcomeId);
    if (!sellOutcome) {
      throw new Error(`Outcome ${outcomeId} not found in market`);
    }

    if (sellOutcome.shares.lt(shares)) {
      throw new Error('Insufficient shares to sell');
    }

    const sellOutcomeIndex = outcomes.findIndex((o) => o.id === outcomeId);

    // Вычисляем произведение всех резервов (инвариант k)
    const k = outcomes.reduce(
      (product, outcome) => product.times(outcome.shares.gt(0) ? outcome.shares : new Decimal(1)),
      new Decimal(1),
    );

    if (k.isZero() || k.isNaN()) {
      throw new Error('Invalid market state: constant product is zero or NaN');
    }

    // Новый резерв для продаваемого исхода
    const newSellReserve = sellOutcome.shares.minus(shares);

    if (newSellReserve.lt(0)) {
      throw new Error('Cannot sell more shares than available');
    }

    if (outcomes.length === 2) {
      // Binary рынок
      const otherOutcomeIndex = sellOutcomeIndex === 0 ? 1 : 0;
      const otherReserve = outcomes[otherOutcomeIndex].shares;
      const sellReserve = outcomes[sellOutcomeIndex].shares;

      // revenue = (R1 * R2) / (R1 - x) - R2
      const revenue = sellReserve
        .times(otherReserve)
        .div(newSellReserve.gt(0) ? newSellReserve : new Decimal(1))
        .minus(otherReserve);

      return revenue.gt(0) ? revenue : new Decimal(0);
    } else {
      // Multi рынок - упрощенный расчет
      const otherOutcomes = outcomes.filter((_, index) => index !== sellOutcomeIndex);
      const totalOtherReserves = otherOutcomes.reduce(
        (sum, outcome) => sum.plus(outcome.shares),
        new Decimal(0),
      );

      if (totalOtherReserves.isZero()) {
        throw new Error('All other outcomes have zero reserves');
      }

      // Увеличиваем резервы других исходов пропорционально
      let totalRevenue = new Decimal(0);
      const sellReserve = outcomes[sellOutcomeIndex].shares;
      
      for (const outcome of otherOutcomes) {
        const proportion = outcome.shares.div(totalOtherReserves);
        const newReserve = outcome.shares.plus(
          outcome.shares.times(shares).div(sellReserve.gt(0) ? sellReserve : new Decimal(1)),
        );
        const revenue = newReserve.minus(outcome.shares);
        totalRevenue = totalRevenue.plus(revenue.gt(0) ? revenue : new Decimal(0));
      }

      return totalRevenue;
    }
  }

  /**
   * Расчет количества акций, которые можно купить за определенную сумму
   * 
   * @param marketState - Состояние рынка
   * @param outcomeId - ID исхода
   * @param cost - Максимальная стоимость
   * @returns Количество акций
   */
  static calculateSharesFromCost(
    marketState: MarketState,
    outcomeId: string,
    cost: Decimal,
  ): Decimal {
    if (cost.isZero()) {
      return new Decimal(0);
    }

    // Используем бинарный поиск
    let minShares = new Decimal(0);
    let maxShares = new Decimal(1000000);
    const precision = new Decimal(0.0001);

    while (maxShares.minus(minShares).gt(precision)) {
      const midShares = minShares.plus(maxShares).div(2);
      const midCost = this.calculateBuyCost(marketState, outcomeId, midShares);

      if (midCost.lte(cost)) {
        minShares = midShares;
      } else {
        maxShares = midShares;
      }
    }

    return minShares;
  }
}

