import Decimal from 'decimal.js';
import {
  MarketState,
  OutcomeState,
  PriceCalculationParams,
  PriceCalculationResult,
  BetType,
  PricingModel,
} from '../types';
import { LMSRModel } from '../models/lmsr.model';
import { ConstantProductModel } from '../models/constant-product.model';
import { SlippageCalculator } from '../utils/slippage';
import { FeeCalculator } from '../utils/fees';

/**
 * Основной сервис для расчета цен
 * 
 * Поддерживает:
 * - LMSR (Logarithmic Market Scoring Rule)
 * - Constant Product (Uniswap-style)
 */
export class PricingService {
  /**
   * Расчет цены для покупки/продажи акций
   * 
   * @param params - Параметры расчета
   * @returns Результат расчета цены
   */
  static calculatePrice(params: PriceCalculationParams): PriceCalculationResult {
    const { marketState, outcomeId, shares, betType } = params;

    // Получаем текущую цену исхода
    const currentPrice = this.getCurrentPrice(marketState, outcomeId);

    // Выбираем модель ценообразования
    let totalCost: Decimal;
    let newOutcomeState: OutcomeState;
    let newMarketState: MarketState;

    if (betType === BetType.BUY) {
      // Расчет стоимости покупки
      totalCost = this.calculateBuyCost(marketState, outcomeId, shares);
      
      // Обновляем состояние исхода
      newOutcomeState = this.updateOutcomeState(
        marketState,
        outcomeId,
        shares,
        betType,
      );
    } else {
      // Расчет выручки от продажи
      totalCost = this.calculateSellRevenue(marketState, outcomeId, shares);
      
      // Обновляем состояние исхода
      newOutcomeState = this.updateOutcomeState(
        marketState,
        outcomeId,
        shares,
        betType,
      );
    }

    // Обновляем состояние рынка
    newMarketState = this.updateMarketState(marketState, newOutcomeState);

    // Расчет комиссии
    const feeRate = marketState.feeRate || new Decimal(0);
    const fee = FeeCalculator.calculate({
      amount: totalCost,
      feeRate,
    });

    // Сумма после комиссии
    const netAmount = betType === BetType.BUY
      ? totalCost.minus(fee) // При покупке комиссия добавляется к стоимости
      : totalCost.minus(fee); // При продаже комиссия вычитается из выручки

    // Цена за акцию (после комиссии)
    const price = shares.gt(0) ? netAmount.div(shares) : new Decimal(0);

    // Расчет проскальзывания
    const executionPrice = shares.gt(0) ? totalCost.div(shares) : currentPrice;
    const slippage = SlippageCalculator.calculate({
      currentPrice,
      executionPrice,
    });

    return {
      price,
      totalCost: netAmount,
      shares,
      fee,
      netAmount,
      slippage,
      newOutcomeState,
      newMarketState,
    };
  }

  /**
   * Получение текущей цены исхода
   * 
   * @param marketState - Состояние рынка
   * @param outcomeId - ID исхода
   * @returns Текущая цена (0-1)
   */
  static getCurrentPrice(
    marketState: MarketState,
    outcomeId: string,
  ): Decimal {
    switch (marketState.pricingModel) {
      case PricingModel.LMSR:
        return LMSRModel.calculatePrice(marketState, outcomeId);
      case PricingModel.CONSTANT_PRODUCT:
        return ConstantProductModel.calculatePrice(marketState, outcomeId);
      default:
        throw new Error(
          `Unsupported pricing model: ${marketState.pricingModel}`,
        );
    }
  }

  /**
   * Расчет стоимости покупки
   * 
   * @param marketState - Состояние рынка
   * @param outcomeId - ID исхода
   * @param shares - Количество акций
   * @returns Стоимость покупки
   */
  static calculateBuyCost(
    marketState: MarketState,
    outcomeId: string,
    shares: Decimal,
  ): Decimal {
    switch (marketState.pricingModel) {
      case PricingModel.LMSR:
        return LMSRModel.calculateBuyCost(marketState, outcomeId, shares);
      case PricingModel.CONSTANT_PRODUCT:
        return ConstantProductModel.calculateBuyCost(
          marketState,
          outcomeId,
          shares,
        );
      default:
        throw new Error(
          `Unsupported pricing model: ${marketState.pricingModel}`,
        );
    }
  }

  /**
   * Расчет выручки от продажи
   * 
   * @param marketState - Состояние рынка
   * @param outcomeId - ID исхода
   * @param shares - Количество акций
   * @returns Выручка от продажи
   */
  static calculateSellRevenue(
    marketState: MarketState,
    outcomeId: string,
    shares: Decimal,
  ): Decimal {
    switch (marketState.pricingModel) {
      case PricingModel.LMSR:
        return LMSRModel.calculateSellRevenue(marketState, outcomeId, shares);
      case PricingModel.CONSTANT_PRODUCT:
        return ConstantProductModel.calculateSellRevenue(
          marketState,
          outcomeId,
          shares,
        );
      default:
        throw new Error(
          `Unsupported pricing model: ${marketState.pricingModel}`,
        );
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
    switch (marketState.pricingModel) {
      case PricingModel.LMSR:
        return LMSRModel.calculateSharesFromCost(
          marketState,
          outcomeId,
          cost,
        );
      case PricingModel.CONSTANT_PRODUCT:
        return ConstantProductModel.calculateSharesFromCost(
          marketState,
          outcomeId,
          cost,
        );
      default:
        throw new Error(
          `Unsupported pricing model: ${marketState.pricingModel}`,
        );
    }
  }

  /**
   * Обновление состояния исхода после операции
   * 
   * @param marketState - Текущее состояние рынка
   * @param outcomeId - ID исхода
   * @param shares - Количество акций
   * @param betType - Тип операции
   * @returns Новое состояние исхода
   */
  private static updateOutcomeState(
    marketState: MarketState,
    outcomeId: string,
    shares: Decimal,
    betType: BetType,
  ): OutcomeState {
    const outcome = marketState.outcomes.find((o) => o.id === outcomeId);
    if (!outcome) {
      throw new Error(`Outcome ${outcomeId} not found`);
    }

    const newShares =
      betType === BetType.BUY
        ? outcome.shares.plus(shares)
        : outcome.shares.minus(shares);

    return {
      ...outcome,
      shares: newShares.gt(0) ? newShares : new Decimal(0),
    };
  }

  /**
   * Обновление состояния рынка после операции
   * 
   * @param marketState - Текущее состояние рынка
   * @param updatedOutcome - Обновленное состояние исхода
   * @returns Новое состояние рынка
   */
  private static updateMarketState(
    marketState: MarketState,
    updatedOutcome: OutcomeState,
  ): MarketState {
    const newOutcomes = marketState.outcomes.map((outcome) =>
      outcome.id === updatedOutcome.id ? updatedOutcome : outcome,
    );

    return {
      ...marketState,
      outcomes: newOutcomes,
    };
  }
}

