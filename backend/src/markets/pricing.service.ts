import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PricingModel } from './entities/market.entity';
import { MarketOutcome } from './entities/market-outcome.entity';

@Injectable()
export class PricingService {
  /**
   * Вычисляет цену покупки/продажи акций используя LMSR (Logarithmic Market Scoring Rule)
   */
  calculateLMSRPrice(
    shares: Decimal,
    totalShares: Decimal,
    liquidity: Decimal,
  ): Decimal {
    // LMSR формула: price = exp(shares / b) / sum(exp(shares_i / b))
    // где b = liquidity
    if (liquidity.isZero()) {
      return new Decimal(0.5); // Равномерное распределение при отсутствии ликвидности
    }

    const exponent = shares.div(liquidity);
    const expValue = Decimal.exp(exponent);
    
    // Для упрощения, используем бинарный рынок
    // В реальности нужно суммировать по всем исходам
    const totalExponent = totalShares.div(liquidity);
    const totalExpValue = Decimal.exp(totalExponent);
    const denominator = expValue.plus(totalExpValue);

    return expValue.div(denominator);
  }

  /**
   * Вычисляет стоимость покупки shares акций используя LMSR
   */
  calculateLMSRCost(
    currentShares: Decimal,
    newShares: Decimal,
    totalShares: Decimal,
    liquidity: Decimal,
  ): Decimal {
    const sharesBefore = currentShares;
    const sharesAfter = currentShares.plus(newShares);
    
    const priceBefore = this.calculateLMSRPrice(sharesBefore, totalShares, liquidity);
    const priceAfter = this.calculateLMSRPrice(sharesAfter, totalShares.plus(newShares), liquidity);
    
    // Интеграл от priceBefore до priceAfter
    // Упрощенная версия: средняя цена * количество
    const avgPrice = priceBefore.plus(priceAfter).div(2);
    return avgPrice.mul(newShares);
  }

  /**
   * Вычисляет цену используя Constant Product Market Maker (x * y = k)
   */
  calculateConstantProductPrice(
    outcomeShares: Decimal,
    otherOutcomeShares: Decimal,
  ): Decimal {
    if (outcomeShares.isZero() && otherOutcomeShares.isZero()) {
      return new Decimal(0.5);
    }
    
    const total = outcomeShares.plus(otherOutcomeShares);
    if (total.isZero()) {
      return new Decimal(0.5);
    }
    
    return outcomeShares.div(total);
  }

  /**
   * Вычисляет стоимость покупки shares акций используя Constant Product
   */
  calculateConstantProductCost(
    outcomeShares: Decimal,
    otherOutcomeShares: Decimal,
    sharesToBuy: Decimal,
  ): Decimal {
    const k = outcomeShares.mul(otherOutcomeShares);
    const newOutcomeShares = outcomeShares.plus(sharesToBuy);
    const newOtherOutcomeShares = k.div(newOutcomeShares);
    const cost = newOtherOutcomeShares.minus(otherOutcomeShares);
    
    return cost.abs();
  }

  /**
   * Универсальный метод для вычисления цены
   */
  calculatePrice(
    model: PricingModel,
    outcome: MarketOutcome,
    otherOutcomes: MarketOutcome[],
    liquidity: Decimal,
  ): Decimal {
    if (model === PricingModel.LMSR) {
      const totalShares = otherOutcomes.reduce(
        (sum, o) => sum.plus(new Decimal(o.shares)),
        new Decimal(0),
      );
      return this.calculateLMSRPrice(
        new Decimal(outcome.shares),
        totalShares,
        liquidity,
      );
    } else {
      // Constant Product
      const otherShares = otherOutcomes.reduce(
        (sum, o) => sum.plus(new Decimal(o.shares)),
        new Decimal(0),
      );
      return this.calculateConstantProductPrice(
        new Decimal(outcome.shares),
        otherShares,
      );
    }
  }

  /**
   * Универсальный метод для вычисления стоимости
   */
  calculateCost(
    model: PricingModel,
    outcome: MarketOutcome,
    otherOutcomes: MarketOutcome[],
    liquidity: Decimal,
    sharesToBuy: Decimal,
  ): Decimal {
    if (model === PricingModel.LMSR) {
      const totalShares = otherOutcomes.reduce(
        (sum, o) => sum.plus(new Decimal(o.shares)),
        new Decimal(0),
      );
      return this.calculateLMSRCost(
        new Decimal(outcome.shares),
        sharesToBuy,
        totalShares,
        liquidity,
      );
    } else {
      // Constant Product
      const otherShares = otherOutcomes.reduce(
        (sum, o) => sum.plus(new Decimal(o.shares)),
        new Decimal(0),
      );
      return this.calculateConstantProductCost(
        new Decimal(outcome.shares),
        otherShares,
        sharesToBuy,
      );
    }
  }
}

