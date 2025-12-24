# Интеграция Market Contract и Liquidity Pool

Руководство по интеграции контрактов Market и Liquidity Pool для создания полноценной платформы прогнозных рынков.

## Архитектура

```
User
  ↓
Market Contract (управление рынками, ставками)
  ↓
Liquidity Pool Contract (ценообразование, ликвидность)
  ↓
TON Blockchain
```

## Схема работы

### 1. Создание рынка

```typescript
// 1. Деплой Market Contract
const marketContract = await deployMarketContract({
  adminAddress: adminAddress,
  deadline: deadlineTimestamp,
  feeRate: 200, // 2%
  feeCollector: feeCollectorAddress,
});

// 2. Деплой Liquidity Pool Contract
const poolContract = await deployLiquidityPoolContract({
  modelType: 0, // LMSR
  initialLiquidity: toNano('10000'), // 10000 TON
  feeRate: 200, // 2%
  feeCollector: feeCollectorAddress,
  adminAddress: adminAddress,
});

// 3. Добавление начальной ликвидности
for (const outcome of market.outcomes) {
  await poolContract.send(
    beginCell()
      .storeUint(1, 32) // OP_ADD_LIQUIDITY
      .storeUint(Date.now(), 64)
      .storeUint(outcome.id, 8)
      .storeCoins(toNano('1000')) // 1000 TON per outcome
      .endCell(),
    { value: toNano('1000') }
  );
}
```

### 2. Размещение ставки

```typescript
// Вариант 1: Через Market Contract (рекомендуется)
// Market Contract сам взаимодействует с Pool

const betMessage = beginCell()
  .storeUint(1, 32) // OP_PLACE_BET
  .storeUint(Date.now(), 64)
  .storeUint(outcomeId, 8)
  .storeUint(betId, 64)
  .endCell();

await marketContract.send(betMessage, {
  value: betAmount,
});

// Market Contract внутри:
// 1. Рассчитывает цену через Pool (get method)
// 2. Покупает акции через Pool (OP_BUY_SHARES)
// 3. Блокирует средства
// 4. Сохраняет ставку

// Вариант 2: Через Integration Contract
const integrationMessage = beginCell()
  .storeUint(1, 32) // OP_PLACE_BET_WITH_POOL
  .storeUint(Date.now(), 64)
  .storeUint(outcomeId, 8)
  .storeUint(betId, 64)
  .storeCoins(sharesAmount)
  .endCell();

await integrationContract.send(integrationMessage, {
  value: betAmount,
});
```

### 3. Разрешение рынка

```typescript
// 1. Администратор разрешает рынок
const resolveMessage = beginCell()
  .storeUint(2, 32) // OP_RESOLVE_MARKET
  .storeUint(Date.now(), 64)
  .storeUint(winningOutcomeId, 8)
  .endCell();

await marketContract.send(resolveMessage);

// 2. Победители могут вывести средства
// Market Contract рассчитывает выплаты на основе:
// - Количества акций выигрышного исхода
// - Текущей цены в Pool
// - AMM модели (LMSR или CP)
```

### 4. Выплата выигрышей

```typescript
// Пользователь выводит выигрыш
const withdrawMessage = beginCell()
  .storeUint(3, 32) // OP_WITHDRAW_WINNINGS
  .storeUint(Date.now(), 64)
  .storeUint(betId, 64)
  .endCell();

await marketContract.send(withdrawMessage);

// Market Contract:
// 1. Проверяет, что рынок разрешен
// 2. Проверяет, что ставка на выигрышный исход
// 3. Рассчитывает выплату через Pool
// 4. Продает акции через Pool (OP_SELL_SHARES)
// 5. Выплачивает пользователю
```

## Расчет цен

### Использование Pool для ценообразования

```typescript
// Market Contract получает цену из Pool
const price = await poolContract.get('calculate_price', [
  { type: 'int', value: outcomeId }
]);

// Или рассчитывает стоимость покупки
const cost = await poolContract.get('calculate_buy_cost', [
  { type: 'int', value: outcomeId },
  { type: 'int', value: sharesAmount }
]);
```

### Off-chain расчеты (рекомендуется)

Для точности используйте `packages/pricing-engine`:

```typescript
import { PricingService, LMSRModel } from '@polymarket/pricing-engine';
import Decimal from 'decimal.js';

// Получите состояние пула
const poolInfo = await poolContract.get('get_pool_info', []);
const outcomeShares = await poolContract.get('get_outcome_shares', [outcomeId]);

// Создайте market state
const marketState = {
  id: marketId,
  outcomes: outcomes.map((o, idx) => ({
    id: o.id,
    shares: new Decimal(shares[idx]),
  })),
  liquidity: new Decimal(poolInfo[1]),
};

// Рассчитайте точную стоимость
const cost = LMSRModel.calculateBuyCost(
  marketState,
  outcomeId,
  new Decimal(sharesAmount)
);

// Отправьте в контракт с проверкой
```

## Синхронизация состояния

### Backend должен синхронизировать:

1. **Market Contract состояние:**
   - Статус рынка
   - Заблокированные средства
   - Разрешенный исход

2. **Pool Contract состояние:**
   - Ликвидность
   - Акции по каждому исходу
   - Текущие цены

3. **Синхронизация:**
   ```typescript
   // Периодически синхронизируйте состояние
   setInterval(async () => {
     // Market state
     const marketInfo = await marketContract.get('get_market_info', []);
     
     // Pool state
     const poolInfo = await poolContract.get('get_pool_info', []);
     
     // Обновите БД
     await db.market.update({
       where: { id: marketId },
       data: {
         status: mapStatus(marketInfo[0]),
         totalVolume: marketInfo[3].toString(),
         // ...
       },
     });
   }, 60000); // Каждую минуту
   ```

## Обработка ошибок

```typescript
try {
  await marketContract.send(betMessage, { value: amount });
} catch (error) {
  // Ошибки Market Contract: 100-599
  // Ошибки Pool Contract: 200-699
  
  if (error.code >= 100 && error.code < 200) {
    // Ошибка размещения ставки
    console.error('Bet placement failed:', error);
  } else if (error.code >= 200 && error.code < 300) {
    // Ошибка добавления ликвидности
    console.error('Liquidity operation failed:', error);
  } else if (error.code >= 300 && error.code < 400) {
    // Ошибка покупки акций
    console.error('Buy shares failed:', error);
  }
}
```

## Best Practices

### 1. Всегда проверяйте цены перед операциями

```typescript
const price = await poolContract.get('calculate_price', [outcomeId]);
if (price[0] > maxPrice) {
  throw new Error('Price too high');
}
```

### 2. Используйте off-chain расчеты для точности

```typescript
// Рассчитайте off-chain
const calculatedCost = PricingService.calculateBuyCost(...);

// Проверьте в контракте
const contractCost = await poolContract.get('calculate_buy_cost', [...]);

// Используйте максимум для безопасности
const finalCost = Math.max(calculatedCost, contractCost);
```

### 3. Мониторьте ликвидность

```typescript
const poolInfo = await poolContract.get('get_pool_info', []);
if (poolInfo[1] < minLiquidity) {
  // Предупредите пользователей или добавьте ликвидность
  console.warn('Low liquidity in pool');
}
```

### 4. Обрабатывайте проскальзывание

```typescript
const cost = await poolContract.get('calculate_buy_cost', [outcomeId, shares]);
const slippageTolerance = 0.05; // 5%
const maxCost = cost[0] * (1 + slippageTolerance);

await poolContract.send(buyMessage, {
  value: maxCost,
});
```

## Пример полного цикла

```typescript
// 1. Создание рынка
const market = await createMarket({ ... });
const pool = await createPool({ ... });

// 2. Добавление ликвидности
await addLiquidity(pool, outcomes, initialAmount);

// 3. Пользователь размещает ставку
const bet = await placeBet(market, pool, {
  outcomeId: 1,
  amount: toNano('10'),
});

// 4. Разрешение рынка
await resolveMarket(market, winningOutcomeId);

// 5. Выплата выигрышей
await withdrawWinnings(market, pool, betId);
```

## Дальнейшее развитие

- [ ] Автоматическая синхронизация через события
- [ ] Batch операции для экономии газа
- [ ] Оптимизация взаимодействия между контрактами
- [ ] Поддержка множественных пулов для одного рынка

