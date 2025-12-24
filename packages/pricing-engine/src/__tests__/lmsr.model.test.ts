import Decimal from 'decimal.js';
import { LMSRModel } from '../models/lmsr.model';
import { MarketState, PricingModel } from '../types';

describe('LMSRModel', () => {
  const createBinaryMarket = (liquidity: Decimal): MarketState => ({
    id: 'market-1',
    pricingModel: PricingModel.LMSR,
    liquidity,
    outcomes: [
      { id: 'outcome-1', shares: new Decimal(0), totalVolume: new Decimal(0) },
      { id: 'outcome-2', shares: new Decimal(0), totalVolume: new Decimal(0) },
    ],
  });

  describe('calculatePrice', () => {
    it('should return equal prices for equal shares', () => {
      const market = createBinaryMarket(new Decimal(1000));
      market.outcomes[0].shares = new Decimal(100);
      market.outcomes[1].shares = new Decimal(100);

      const price1 = LMSRModel.calculatePrice(market, 'outcome-1');
      const price2 = LMSRModel.calculatePrice(market, 'outcome-2');

      expect(price1.toNumber()).toBeCloseTo(0.5, 2);
      expect(price2.toNumber()).toBeCloseTo(0.5, 2);
    });

    it('should return higher price for outcome with more shares', () => {
      const market = createBinaryMarket(new Decimal(1000));
      market.outcomes[0].shares = new Decimal(200);
      market.outcomes[1].shares = new Decimal(100);

      const price1 = LMSRModel.calculatePrice(market, 'outcome-1');
      const price2 = LMSRModel.calculatePrice(market, 'outcome-2');

      expect(price1.toNumber()).toBeGreaterThan(price2.toNumber());
    });
  });

  describe('calculateBuyCost', () => {
    it('should return zero cost for zero shares', () => {
      const market = createBinaryMarket(new Decimal(1000));
      const cost = LMSRModel.calculateBuyCost(market, 'outcome-1', new Decimal(0));
      expect(cost.toNumber()).toBe(0);
    });

    it('should return positive cost for positive shares', () => {
      const market = createBinaryMarket(new Decimal(1000));
      const cost = LMSRModel.calculateBuyCost(market, 'outcome-1', new Decimal(10));
      expect(cost.toNumber()).toBeGreaterThan(0);
    });

    it('should increase cost with more shares', () => {
      const market = createBinaryMarket(new Decimal(1000));
      const cost1 = LMSRModel.calculateBuyCost(market, 'outcome-1', new Decimal(10));
      const cost2 = LMSRModel.calculateBuyCost(market, 'outcome-1', new Decimal(20));
      expect(cost2.toNumber()).toBeGreaterThan(cost1.toNumber());
    });
  });

  describe('calculateSellRevenue', () => {
    it('should return zero revenue for zero shares', () => {
      const market = createBinaryMarket(new Decimal(1000));
      market.outcomes[0].shares = new Decimal(100);
      const revenue = LMSRModel.calculateSellRevenue(market, 'outcome-1', new Decimal(0));
      expect(revenue.toNumber()).toBe(0);
    });

    it('should return positive revenue for positive shares', () => {
      const market = createBinaryMarket(new Decimal(1000));
      market.outcomes[0].shares = new Decimal(100);
      const revenue = LMSRModel.calculateSellRevenue(market, 'outcome-1', new Decimal(10));
      expect(revenue.toNumber()).toBeGreaterThan(0);
    });

    it('should throw error for insufficient shares', () => {
      const market = createBinaryMarket(new Decimal(1000));
      market.outcomes[0].shares = new Decimal(10);
      expect(() => {
        LMSRModel.calculateSellRevenue(market, 'outcome-1', new Decimal(20));
      }).toThrow('Insufficient shares');
    });
  });
});

