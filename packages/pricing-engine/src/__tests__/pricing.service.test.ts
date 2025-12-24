import Decimal from 'decimal.js';
import { PricingService } from '../services/pricing.service';
import { MarketState, PricingModel, BetType } from '../types';

describe('PricingService', () => {
  const createBinaryMarket = (liquidity: Decimal): MarketState => ({
    id: 'market-1',
    pricingModel: PricingModel.LMSR,
    liquidity,
    feeRate: new Decimal(0.02), // 2%
    outcomes: [
      { id: 'outcome-1', shares: new Decimal(100), totalVolume: new Decimal(0) },
      { id: 'outcome-2', shares: new Decimal(100), totalVolume: new Decimal(0) },
    ],
  });

  describe('getCurrentPrice', () => {
    it('should return price between 0 and 1', () => {
      const market = createBinaryMarket(new Decimal(1000));
      const price = PricingService.getCurrentPrice(market, 'outcome-1');
      expect(price.toNumber()).toBeGreaterThanOrEqual(0);
      expect(price.toNumber()).toBeLessThanOrEqual(1);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate buy price with fee', () => {
      const market = createBinaryMarket(new Decimal(1000));
      const result = PricingService.calculatePrice({
        marketState: market,
        outcomeId: 'outcome-1',
        shares: new Decimal(10),
        betType: BetType.BUY,
      });

      expect(result.price.toNumber()).toBeGreaterThan(0);
      expect(result.fee.toNumber()).toBeGreaterThan(0);
      expect(result.totalCost.toNumber()).toBeGreaterThan(0);
      expect(result.slippage.toNumber()).toBeDefined();
    });

    it('should calculate sell price with fee', () => {
      const market = createBinaryMarket(new Decimal(1000));
      const result = PricingService.calculatePrice({
        marketState: market,
        outcomeId: 'outcome-1',
        shares: new Decimal(10),
        betType: BetType.SELL,
      });

      expect(result.price.toNumber()).toBeGreaterThan(0);
      expect(result.fee.toNumber()).toBeGreaterThan(0);
      expect(result.totalCost.toNumber()).toBeGreaterThan(0);
    });
  });
});

