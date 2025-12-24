# Quick Start - Liquidity Pool Contract

Быстрое руководство по использованию TON Liquidity Pool Contract.

## Компиляция

```bash
cd contracts/ton

# Компиляция контракта пула
func -SPA stdlib.fc liquidity-pool.fc -o liquidity-pool.fif
```

## Деплой

```bash
toncli deploy liquidity-pool.fif --testnet
```

При деплое нужно передать начальные данные:
- `model_type` - 0 (LMSR) или 1 (Constant Product)
- `initial_liquidity` - Начальная ликвидность (для LMSR это параметр b)
- `fee_rate` - Комиссия в базисных пунктах (200 = 2%)
- `fee_collector` - Адрес для сбора комиссий
- `admin_address` - Адрес администратора

## Базовое использование

### 1. Добавление ликвидности

```typescript
import { beginCell, toNano } from '@ton/core';

const message = beginCell()
  .storeUint(1, 32) // OP_ADD_LIQUIDITY
  .storeUint(Date.now(), 64)
  .storeUint(1, 8) // outcome_id
  .storeCoins(toNano('100')) // 100 TON
  .endCell();

await pool.send(message, {
  value: toNano('100'),
});
```

### 2. Покупка акций

```typescript
// Сначала получите стоимость
const cost = await pool.get('calculate_buy_cost', [
  { type: 'int', value: 1 }, // outcome_id
  { type: 'int', value: toNano('10') } // shares
]);

const message = beginCell()
  .storeUint(3, 32) // OP_BUY_SHARES
  .storeUint(Date.now(), 64)
  .storeUint(1, 8) // outcome_id
  .storeCoins(toNano('10')) // shares
  .endCell();

await pool.send(message, {
  value: cost[0] + toNano('0.1'), // Добавьте немного для комиссии
});
```

### 3. Получение цены

```typescript
const price = await pool.get('calculate_price', [
  { type: 'int', value: 1 } // outcome_id
]);

// Цена в fixed point (PRECISION = 1000000)
const priceDecimal = price[0] / 1000000;
console.log('Price:', priceDecimal); // 0.0 - 1.0
```

## Выбор модели

### LMSR (рекомендуется для prediction markets)

```typescript
// При деплое установите model_type = 0
// Параметр b (liquidity) должен быть достаточно большим (1000+)
// Для крупных рынков используйте b = 10000
```

### Constant Product (проще, но требует начальной ликвидности)

```typescript
// При деплое установите model_type = 1
// Добавьте равную ликвидность для всех исходов
// Например, для binary рынка: 100 TON для каждого исхода
```

## Интеграция с Market Contract

См. `INTEGRATION-GUIDE.md` для полной документации по интеграции.

## Документация

- `liquidity-pool-README.md` - Полная документация
- `liquidity-pool-EXAMPLES.md` - Примеры использования
- `INTEGRATION-GUIDE.md` - Интеграция с Market Contract

