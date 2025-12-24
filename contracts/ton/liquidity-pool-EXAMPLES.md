# Примеры использования Liquidity Pool Contract

## Базовые операции

### 1. Инициализация пула

При деплое контракта нужно передать начальные параметры:
- `model_type` - 0 (LMSR) или 1 (Constant Product)
- `initial_liquidity` - Начальная ликвидность
- `fee_rate` - Комиссия (200 = 2%)
- `fee_collector` - Адрес для сбора комиссий
- `admin_address` - Адрес администратора

### 2. Добавление ликвидности

```typescript
import { beginCell, Address, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';

const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

const poolAddress = Address.parse('YOUR_POOL_ADDRESS');
const pool = await client.open(
  LiquidityPoolContract.fromAddress(poolAddress)
);

// Добавить 100 TON ликвидности для исхода 1
const message = beginCell()
  .storeUint(1, 32) // OP_ADD_LIQUIDITY
  .storeUint(Date.now(), 64) // query_id
  .storeUint(1, 8) // outcome_id
  .storeCoins(toNano('100')) // amount
  .endCell();

await pool.send(message, {
  value: toNano('100'),
});

// Получите LP токены (1:1 с добавленной суммой)
```

### 3. Получение информации о пуле

```typescript
const info = await pool.get('get_pool_info', []);

console.log({
  modelType: info[0], // 0 = LMSR, 1 = Constant Product
  liquidity: info[1] / 1e9, // в TON
  totalLPTokens: info[2] / 1e9,
  feeRate: info[3], // в basis points
});

// Получить количество акций для исхода
const shares = await pool.get('get_outcome_shares', [
  { type: 'int', value: 1 } // outcome_id
]);
console.log('Outcome 1 shares:', shares[0] / 1e9, 'TON');
```

### 4. Расчет цены

```typescript
// Получить текущую цену исхода
const price = await pool.get('calculate_price', [
  { type: 'int', value: 1 } // outcome_id
]);

// Цена в fixed point (PRECISION = 1000000)
const priceDecimal = price[0] / 1000000;
console.log('Price:', priceDecimal); // 0.0 - 1.0
```

### 5. Покупка акций

```typescript
const outcomeId = 1;
const sharesToBuy = toNano('10'); // 10 shares

// Сначала получите стоимость
const costResult = await pool.get('calculate_buy_cost', [
  { type: 'int', value: outcomeId },
  { type: 'int', value: sharesToBuy }
]);

const baseCost = costResult[0];
const feeRate = (await pool.get('get_pool_info', []))[3];
const fee = (baseCost * feeRate) / 10000;
const totalCost = baseCost + fee;

console.log('Base cost:', baseCost / 1e9, 'TON');
console.log('Fee:', fee / 1e9, 'TON');
console.log('Total cost:', totalCost / 1e9, 'TON');

// Покупка
const message = beginCell()
  .storeUint(3, 32) // OP_BUY_SHARES
  .storeUint(Date.now(), 64)
  .storeUint(outcomeId, 8)
  .storeCoins(sharesToBuy)
  .endCell();

await pool.send(message, {
  value: totalCost + toNano('0.1'), // Добавьте немного для безопасности
});
```

### 6. Продажа акций

```typescript
const outcomeId = 1;
const sharesToSell = toNano('10'); // 10 shares

const message = beginCell()
  .storeUint(4, 32) // OP_SELL_SHARES
  .storeUint(Date.now(), 64)
  .storeUint(outcomeId, 8)
  .storeCoins(sharesToSell)
  .endCell();

await pool.send(message);

// Выручка будет отправлена автоматически
```

## Интеграция с Market Contract

### Схема работы

```typescript
// 1. Пользователь размещает ставку через Market Contract
const marketMessage = beginCell()
  .storeUint(1, 32) // OP_PLACE_BET
  .storeUint(Date.now(), 64)
  .storeUint(outcomeId, 8)
  .storeUint(betId, 64)
  .endCell();

// 2. Market Contract взаимодействует с Liquidity Pool
// (это должно быть реализовано в Market Contract)
const poolMessage = beginCell()
  .storeUint(3, 32) // OP_BUY_SHARES
  .storeUint(Date.now(), 64)
  .storeUint(outcomeId, 8)
  .storeCoins(sharesAmount)
  .endCell();

// Market Contract отправляет сообщение в Pool
await pool.send(poolMessage, {
  value: calculatedCost,
  from: marketContractAddress,
});
```

## Административные операции

### Изменение модели AMM

```typescript
// Только администратор
const message = beginCell()
  .storeUint(5, 32) // OP_SET_MODEL
  .storeUint(Date.now(), 64)
  .storeUint(0, 8) // 0 = LMSR, 1 = Constant Product
  .endCell();

await pool.send(message);
```

### Обновление комиссии

```typescript
// Только администратор
// 200 = 2%, 500 = 5%, максимум 1000 = 10%
const message = beginCell()
  .storeUint(6, 32) // OP_UPDATE_FEE_RATE
  .storeUint(Date.now(), 64)
  .storeUint(300, 8) // 3%
  .endCell();

await pool.send(message);
```

## Работа с LMSR моделью

### Инициализация LMSR пула

```typescript
// При деплое установите:
// model_type = 0 (LMSR)
// liquidity = 10000 (параметр b)
// Добавьте начальную ликвидность для каждого исхода
```

### Расчет цены в LMSR

```typescript
// Цена зависит от:
// - Количества акций исхода (q_i)
// - Параметра ликвидности (b)
// - Количества акций других исходов

// Формула: p_i = exp(q_i / b) / Σ(exp(q_j / b))
const price = await pool.get('calculate_price', [
  { type: 'int', value: outcomeId }
]);
```

## Работа с Constant Product моделью

### Инициализация CP пула

```typescript
// При деплое установите:
// model_type = 1 (Constant Product)
// liquidity = 0 (будет рассчитываться автоматически)

// Добавьте равную ликвидность для всех исходов
// Например, для binary рынка:
// Outcome 1: 100 TON
// Outcome 2: 100 TON
// Начальная цена каждого: 0.5 (50%)
```

### Расчет цены в CP

```typescript
// Цена = резерв исхода / сумма всех резервов
// Инвариант: произведение всех резервов = константа

const price = await pool.get('calculate_price', [
  { type: 'int', value: outcomeId }
]);
```

## Обработка ошибок

```typescript
try {
  await pool.send(message, { value: amount });
} catch (error) {
  // Коды ошибок:
  // 100: Division by zero
  // 101: Invalid logarithm argument
  // 200-299: Ошибки добавления ликвидности
  // 300-399: Ошибки покупки акций
  // 400-499: Ошибки продажи акций
  // 500-599: Ошибки установки модели
  // 600-699: Ошибки обновления комиссии
  // 999: Неизвестная операция
  
  console.error('Pool error:', error);
}
```

## Best Practices

### 1. Всегда проверяйте цену перед покупкой

```typescript
const price = await pool.get('calculate_price', [outcomeId]);
if (price[0] > maxPrice) {
  throw new Error('Price too high');
}
```

### 2. Учитывайте проскальзывание

```typescript
const cost = await pool.get('calculate_buy_cost', [outcomeId, shares]);
const maxSlippage = cost[0] * 0.05; // 5% slippage tolerance
const totalWithSlippage = cost[0] + maxSlippage;
```

### 3. Проверяйте ликвидность

```typescript
const info = await pool.get('get_pool_info', []);
if (info[1] < minLiquidity) {
  throw new Error('Insufficient liquidity');
}
```

### 4. Используйте off-chain расчеты для точности

```typescript
// Используйте packages/pricing-engine для точных расчетов
import { PricingService, LMSRModel } from '@polymarket/pricing-engine';

const marketState = {
  id: 'market-1',
  outcomes: [
    { id: '1', shares: new Decimal(shares1) },
    { id: '2', shares: new Decimal(shares2) },
  ],
  liquidity: new Decimal(liquidity),
};

const cost = LMSRModel.calculateBuyCost(
  marketState,
  outcomeId,
  new Decimal(sharesToBuy)
);

// Затем отправьте в контракт с проверкой
```

## Мониторинг

### Отслеживание изменений ликвидности

```typescript
// Периодически проверяйте состояние пула
setInterval(async () => {
  const info = await pool.get('get_pool_info', []);
  console.log('Pool liquidity:', info[1] / 1e9, 'TON');
  
  // Проверьте цены всех исходов
  for (let i = 1; i <= numOutcomes; i++) {
    const price = await pool.get('calculate_price', [
      { type: 'int', value: i }
    ]);
    console.log(`Outcome ${i} price:`, price[0] / 1000000);
  }
}, 60000); // Каждую минуту
```

