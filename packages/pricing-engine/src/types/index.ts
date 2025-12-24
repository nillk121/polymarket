import Decimal from 'decimal.js';

/**
 * Тип модели ценообразования
 */
export enum PricingModel {
  LMSR = 'lmsr',
  CONSTANT_PRODUCT = 'constant_product',
}

/**
 * Тип операции (покупка или продажа)
 */
export enum BetType {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * Состояние исхода для расчета цены
 */
export interface OutcomeState {
  id: string;
  shares: Decimal; // Количество акций (q_i в LMSR)
  totalVolume: Decimal; // Общий объем торговли
}

/**
 * Состояние рынка для расчета цены
 */
export interface MarketState {
  id: string;
  pricingModel: PricingModel;
  liquidity: Decimal; // Общая ликвидность (b в LMSR, или начальная ликвидность)
  outcomes: OutcomeState[];
  feeRate?: Decimal; // Комиссия (0-1)
}

/**
 * Параметры для расчета цены покупки/продажи
 */
export interface PriceCalculationParams {
  marketState: MarketState;
  outcomeId: string;
  shares: Decimal; // Количество акций для покупки/продажи
  betType: BetType;
}

/**
 * Результат расчета цены
 */
export interface PriceCalculationResult {
  price: Decimal; // Цена за акцию
  totalCost: Decimal; // Общая стоимость (для покупки) или выручка (для продажи)
  shares: Decimal; // Количество акций
  fee: Decimal; // Комиссия
  netAmount: Decimal; // Сумма после комиссии
  slippage: Decimal; // Проскальзывание (в процентах)
  newOutcomeState: OutcomeState; // Новое состояние исхода после операции
  newMarketState: MarketState; // Новое состояние рынка после операции
}

/**
 * Параметры для расчета проскальзывания
 */
export interface SlippageParams {
  currentPrice: Decimal;
  executionPrice: Decimal;
}

/**
 * Параметры для расчета комиссии
 */
export interface FeeParams {
  amount: Decimal;
  feeRate: Decimal;
}

/**
 * Параметры для инициализации пула ликвидности
 */
export interface LiquidityPoolInitParams {
  marketId: string;
  liquidity: Decimal;
  outcomes: OutcomeState[];
  pricingModel: PricingModel;
}

