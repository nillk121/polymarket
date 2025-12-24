import Decimal from 'decimal.js';
import {
  MarketState,
  OutcomeState,
  PriceCalculationParams,
  PriceCalculationResult,
  BetType,
} from '../types';

/**
 * LMSR (Logarithmic Market Scoring Rule) Pricing Model
 * 
 * Математическая формула:
 * 
 * Цена исхода i:
 * p_i = exp(q_i / b) / Σ(exp(q_j / b))
 * 
 * где:
 * - q_i - количество акций исхода i
 * - b - параметр ликвидности (liquidity)
 * - exp - экспонента
 * 
 * Стоимость покупки x акций исхода i:
 * Cost(x) = b * ln(Σ(exp((q_j + δ_ij * x) / b))) - b * ln(Σ(exp(q_j / b)))
 * 
 * где δ_ij = 1 если i == j, иначе 0
 * 
 * Стоимость продажи x акций исхода i:
 * Revenue(x) = b * ln(Σ(exp(q_j / b))) - b * ln(Σ(exp((q_j - δ_ij * x) / b)))
 */
export class LMSRModel {
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
    const { outcomes, liquidity } = marketState;
    const b = liquidity;

    if (b.isZero()) {
      // Если ликвидность равна нулю, возвращаем равномерное распределение
      return new Decimal(1).div(outcomes.length);
    }

    // Вычисляем exp(q_i / b) для всех исходов
    const expValues = outcomes.map((outcome) => {
      const q = outcome.shares;
      const ratio = q.div(b);
      return Decimal.exp(ratio);
    });

    // Находим индекс нужного исхода
    const outcomeIndex = outcomes.findIndex((o) => o.id === outcomeId);
    if (outcomeIndex === -1) {
      throw new Error(`Outcome ${outcomeId} not found in market`);
    }

    // Сумма всех exp(q_j / b)
    const sumExp = expValues.reduce((sum, val) => sum.plus(val), new Decimal(0));

    if (sumExp.isZero()) {
      // Если сумма равна нулю, возвращаем равномерное распределение
      return new Decimal(1).div(outcomes.length);
    }

    // Цена = exp(q_i / b) / Σ(exp(q_j / b))
    const price = expValues[outcomeIndex].div(sumExp);

    return price;
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
    const { outcomes, liquidity } = marketState;
    const b = liquidity;

    if (b.isZero()) {
      throw new Error('Market has no liquidity');
    }

    if (shares.isZero()) {
      return new Decimal(0);
    }

    // Текущее состояние: вычисляем ln(Σ(exp(q_j / b)))
    const currentExpValues = outcomes.map((outcome) => {
      const q = outcome.shares;
      return Decimal.exp(q.div(b));
    });
    const currentSumExp = currentExpValues.reduce(
      (sum, val) => sum.plus(val),
      new Decimal(0),
    );
    const currentCost = b.times(Decimal.ln(currentSumExp));

    // Новое состояние после покупки: вычисляем ln(Σ(exp((q_j + δ_ij * x) / b)))
    const newExpValues = outcomes.map((outcome, index) => {
      const q = outcome.shares;
      const delta = outcome.id === outcomeId ? shares : new Decimal(0);
      return Decimal.exp(q.plus(delta).div(b));
    });
    const newSumExp = newExpValues.reduce(
      (sum, val) => sum.plus(val),
      new Decimal(0),
    );
    const newCost = b.times(Decimal.ln(newSumExp));

    // Стоимость = новая стоимость - текущая стоимость
    return newCost.minus(currentCost);
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
    const { outcomes, liquidity } = marketState;
    const b = liquidity;

    if (b.isZero()) {
      throw new Error('Market has no liquidity');
    }

    if (shares.isZero()) {
      return new Decimal(0);
    }

    // Проверяем, что у пользователя достаточно акций
    const outcome = outcomes.find((o) => o.id === outcomeId);
    if (!outcome) {
      throw new Error(`Outcome ${outcomeId} not found in market`);
    }

    if (outcome.shares.lt(shares)) {
      throw new Error('Insufficient shares to sell');
    }

    // Текущее состояние: вычисляем ln(Σ(exp(q_j / b)))
    const currentExpValues = outcomes.map((outcome) => {
      const q = outcome.shares;
      return Decimal.exp(q.div(b));
    });
    const currentSumExp = currentExpValues.reduce(
      (sum, val) => sum.plus(val),
      new Decimal(0),
    );
    const currentCost = b.times(Decimal.ln(currentSumExp));

    // Новое состояние после продажи: вычисляем ln(Σ(exp((q_j - δ_ij * x) / b)))
    const newExpValues = outcomes.map((outcome) => {
      const q = outcome.shares;
      const delta = outcome.id === outcomeId ? shares : new Decimal(0);
      const newQ = q.minus(delta);
      // Защита от отрицательных значений
      return Decimal.exp(newQ.gt(0) ? newQ.div(b) : new Decimal(0));
    });
    const newSumExp = newExpValues.reduce(
      (sum, val) => sum.plus(val),
      new Decimal(0),
    );
    const newCost = b.times(Decimal.ln(newSumExp));

    // Выручка = текущая стоимость - новая стоимость
    return currentCost.minus(newCost);
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

    // Используем бинарный поиск для нахождения количества акций
    let minShares = new Decimal(0);
    let maxShares = new Decimal(1000000); // Максимальное значение
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

