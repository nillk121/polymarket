# Pricing Engine

AMM (Automated Market Maker) pricing engine для Polymarket.

## Возможности

- ✅ LMSR (Logarithmic Market Scoring Rule) модель
- ✅ Constant Product (Uniswap-style) модель
- ✅ Расчет цен для каждого исхода
- ✅ Обработка проскальзывания (slippage)
- ✅ Расчет комиссий
- ✅ Поддержка binary и multiple choice рынков

## Математические модели

### LMSR (Logarithmic Market Scoring Rule)

**Формула цены:**
```
p_i = exp(q_i / b) / Σ(exp(q_j / b))
```

где:
- `p_i` - цена исхода i
- `q_i` - количество акций исхода i
- `b` - параметр ликвидности

**Стоимость покупки x акций:**
```
Cost(x) = b * ln(Σ(exp((q_j + δ_ij * x) / b))) - b * ln(Σ(exp(q_j / b)))
```

**Выручка от продажи x акций:**
```
Revenue(x) = b * ln(Σ(exp(q_j / b))) - b * ln(Σ(exp((q_j - δ_ij * x) / b)))
```

### Constant Product

**Формула цены:**
```
p_i = R_i / Σ(R_j)
```

где:
- `R_i` - резерв исхода i
- Инвариант: `Π(R_i) = k` (константа)

**При покупке x акций:**
- Резерв покупаемого исхода увеличивается на x
- Резервы других исходов уменьшаются для сохранения инварианта
- Стоимость = сумма уменьшений других резервов

## Использование

### Базовый пример

```typescript
import { PricingService, MarketState, BetType } from '@polymarket/pricing-engine';
import Decimal from 'decimal.js';

// Состояние рынка
const marketState: MarketState = {
  id: 'market-1',
  pricingModel: PricingModel.LMSR,
  liquidity: new Decimal(1000),
  feeRate: new Decimal(0.02), // 2% комиссия
  outcomes: [
    { id: 'outcome-1', shares: new Decimal(100), totalVolume: new Decimal(0) },
    { id: 'outcome-2', shares: new Decimal(100), totalVolume: new Decimal(0) },
  ],
};

// Получение текущей цены
const price = PricingService.getCurrentPrice(marketState, 'outcome-1');
console.log('Current price:', price.toString()); // ~0.5

// Расчет стоимости покупки
const result = PricingService.calculatePrice({
  marketState,
  outcomeId: 'outcome-1',
  shares: new Decimal(10),
  betType: BetType.BUY,
});

console.log('Price per share:', result.price.toString());
console.log('Total cost:', result.totalCost.toString());
console.log('Fee:', result.fee.toString());
console.log('Slippage:', result.slippage.toString(), '%');
```

### Расчет с учетом проскальзывания

```typescript
import { SlippageCalculator } from '@polymarket/pricing-engine';

const currentPrice = new Decimal(0.5);
const maxSlippage = new Decimal(5); // 5%

const maxPrice = SlippageCalculator.calculateMaxPrice(currentPrice, maxSlippage);
const minPrice = SlippageCalculator.calculateMinPrice(currentPrice, maxSlippage);

// Проверка проскальзывания
const slippage = SlippageCalculator.calculate({
  currentPrice,
  executionPrice: result.price,
});

if (SlippageCalculator.exceedsMax(slippage, maxSlippage)) {
  throw new Error('Slippage exceeds maximum');
}
```

### Расчет комиссий

```typescript
import { FeeCalculator } from '@polymarket/pricing-engine';

const amount = new Decimal(100);
const feeRate = new Decimal(0.02); // 2%

const fee = FeeCalculator.calculate({ amount, feeRate });
const netAmount = FeeCalculator.calculateNetAmount(amount, feeRate);

console.log('Fee:', fee.toString()); // 2
console.log('Net amount:', netAmount.toString()); // 98
```

## API

### PricingService

- `calculatePrice(params)` - Расчет цены для покупки/продажи
- `getCurrentPrice(marketState, outcomeId)` - Получение текущей цены
- `calculateBuyCost(marketState, outcomeId, shares)` - Расчет стоимости покупки
- `calculateSellRevenue(marketState, outcomeId, shares)` - Расчет выручки от продажи
- `calculateSharesFromCost(marketState, outcomeId, cost)` - Расчет количества акций за сумму

### SlippageCalculator

- `calculate(params)` - Расчет проскальзывания
- `exceedsMax(slippage, maxSlippage)` - Проверка превышения максимума
- `calculateMaxPrice(currentPrice, maxSlippage)` - Максимальная цена
- `calculateMinPrice(currentPrice, maxSlippage)` - Минимальная цена

### FeeCalculator

- `calculate(params)` - Расчет комиссии
- `calculateNetAmount(amount, feeRate)` - Сумма после комиссии
- `calculateGrossAmount(netAmount, feeRate)` - Сумма с учетом комиссии
- `isValidFeeRate(feeRate)` - Валидация ставки комиссии

## Тестирование

```bash
cd packages/pricing-engine
npm test
```

## Примечания

- Все расчеты используют `decimal.js` для точности
- Поддерживаются binary (2 исхода) и multi (3+ исходов) рынки
- Проскальзывание рассчитывается автоматически
- Комиссии применяются к каждой операции

