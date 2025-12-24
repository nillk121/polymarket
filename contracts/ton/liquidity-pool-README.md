# TON Liquidity Pool Contract

Смарт-контракт для управления ликвидностными пулами AMM (Automated Market Maker) на TON блокчейне.

## Возможности

- ✅ **LMSR (Logarithmic Market Scoring Rule)** - Модель для prediction markets
- ✅ **Constant Product** - Uniswap-style модель
- ✅ **Обработка комиссий** - Автоматическое взимание и распределение комиссий
- ✅ **Управление ликвидностью** - Добавление и удаление ликвидности
- ✅ **Покупка/продажа акций** - Торговля через AMM

## Операции контракта

### OP_ADD_LIQUIDITY (1)
Добавление ликвидности в пул

**Формат сообщения:**
```
op (32 bits) | query_id (64 bits) | outcome_id (8 bits) | amount (coins)
```

**Проверки:**
- Минимальная сумма: 1 TON
- Автоматическое взимание комиссии

**Результат:**
- Ликвидность добавлена в пул
- Выдаются LP токены (1:1 с добавленной суммой)
- Комиссия отправляется fee_collector

### OP_BUY_SHARES (3)
Покупка акций исхода

**Формат сообщения:**
```
op (32 bits) | query_id (64 bits) | outcome_id (8 bits) | shares_amount (coins)
```

**Проверки:**
- Минимальная сумма: 1 TON
- Достаточность средств для покупки

**Результат:**
- Акции куплены по текущей цене AMM
- Комиссия взимается и отправляется fee_collector
- Избыточные средства возвращаются

### OP_SELL_SHARES (4)
Продажа акций исхода

**Формат сообщения:**
```
op (32 bits) | query_id (64 bits) | outcome_id (8 bits) | shares_amount (coins)
```

**Проверки:**
- Достаточность акций для продажи

**Результат:**
- Акции проданы по текущей цене AMM
- Выручка отправляется пользователю
- Комиссия взимается и отправляется fee_collector

### OP_SET_MODEL (5)
Установка модели AMM (только админ)

**Формат сообщения:**
```
op (32 bits) | query_id (64 bits) | model_type (8 bits)
```

**model_type:**
- 0 = LMSR
- 1 = Constant Product

### OP_UPDATE_FEE_RATE (6)
Обновление ставки комиссии (только админ)

**Формат сообщения:**
```
op (32 bits) | query_id (64 bits) | new_fee_rate (8 bits)
```

**fee_rate:** в базисных пунктах (200 = 2%, максимум 1000 = 10%)

## Структура данных

### Pool Data
```
outcomes_dict (cell) - Словарь исходов -> shares/reserves
model_type (8 bits) - Тип модели (LMSR или Constant Product)
liquidity (coins) - Параметр ликвидности (b для LMSR, total reserves для CP)
total_liquidity_tokens (coins) - Общее количество LP токенов
fee_rate (8 bits) - Комиссия в базисных пунктах
fee_collector (address) - Адрес для сбора комиссий
admin_address (address) - Адрес администратора
```

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

**Стоимость покупки:**
```
Cost(x) = b * ln(Σ(exp((q_j + δ_ij * x) / b))) - b * ln(Σ(exp(q_j / b)))
```

**Примечание:** В TON контракте используются упрощенные аппроксимации из-за ограничений FunC. Для точных расчетов рекомендуется использовать off-chain вычисления.

### Constant Product

**Инвариант:**
```
Π(R_i) = k (константа)
```

**Цена:**
```
p_i = R_i / Σ(R_j)
```

**При покупке:**
- Резерв покупаемого исхода увеличивается
- Резервы других исходов уменьшаются для сохранения инварианта
- Стоимость = изменение в других резервах

## Get Methods

### get_pool_info()
Возвращает информацию о пуле:
- model_type
- liquidity
- total_liquidity_tokens
- fee_rate

### get_outcome_shares(outcome_id)
Возвращает количество акций/резервов для исхода

### calculate_price(outcome_id)
Возвращает текущую цену исхода (в fixed point, PRECISION = 1000000)

### calculate_buy_cost(outcome_id, shares)
Возвращает стоимость покупки указанного количества акций

## Комиссии

Комиссия рассчитывается по формуле:
```
fee = amount * fee_rate / 10000
```

Комиссия автоматически:
- Взимается при каждой операции
- Отправляется на адрес fee_collector
- Не влияет на расчет цен AMM

## Использование

### Добавление ликвидности

```typescript
import { beginCell, Address, toNano } from '@ton/core';

const message = beginCell()
  .storeUint(1, 32) // OP_ADD_LIQUIDITY
  .storeUint(queryId, 64)
  .storeUint(outcomeId, 8)
  .storeCoins(toNano('100')) // 100 TON
  .endCell();

await contract.send(message, {
  value: toNano('100'),
});
```

### Покупка акций

```typescript
const message = beginCell()
  .storeUint(3, 32) // OP_BUY_SHARES
  .storeUint(queryId, 64)
  .storeUint(outcomeId, 8)
  .storeCoins(toNano('10')) // 10 shares
  .endCell();

// Сначала получите стоимость через get method
const cost = await contract.get('calculate_buy_cost', [
  { type: 'int', value: outcomeId },
  { type: 'int', value: toNano('10') }
]);

await contract.send(message, {
  value: cost[0] + toNano('0.1'), // Добавьте немного для комиссии
});
```

### Продажа акций

```typescript
const message = beginCell()
  .storeUint(4, 32) // OP_SELL_SHARES
  .storeUint(queryId, 64)
  .storeUint(outcomeId, 8)
  .storeCoins(toNano('10')) // 10 shares
  .endCell();

await contract.send(message);
```

## Интеграция с Market Contract

Liquidity Pool контракт может использоваться вместе с Market контрактом:

1. **Market Contract** - Управляет рынками, ставками, разрешением
2. **Liquidity Pool Contract** - Управляет ликвидностью и ценообразованием

### Схема работы:

```
User → Market Contract (place bet)
  ↓
Market Contract → Liquidity Pool (buy shares)
  ↓
Liquidity Pool → Calculate price (LMSR/CP)
  ↓
Liquidity Pool → Update reserves/shares
  ↓
Market Contract → Lock funds
```

## Ограничения и упрощения

### Математические функции

FunC не поддерживает сложные математические функции (exp, ln) напрямую. В контракте используются упрощенные аппроксимации:

- `exp_approx()` - Упрощенная экспонента
- `ln_approx()` - Упрощенный логарифм

**Рекомендация:** Для точных расчетов используйте:
1. Off-chain вычисления через `packages/pricing-engine`
2. Передавайте результаты в контракт
3. Контракт проверяет корректность

### Fixed Point Arithmetic

Все расчеты используют fixed point арифметику с точностью `PRECISION = 1000000` (6 знаков после запятой).

## Безопасность

### Проверки

1. **Минимальные суммы** - Защита от спама
2. **Администратор** - Только админ может менять модель и комиссию
3. **Достаточность средств** - Проверка перед операциями
4. **Ограничение комиссии** - Максимум 10% (1000 basis points)

### Риски

1. **Неточность расчетов** - Упрощенные математические функции
2. **Проскальзывание** - Цены могут меняться между расчетом и исполнением
3. **Ликвидность** - Низкая ликвидность может привести к большим проскальзываниям

## Дальнейшее развитие

- [ ] Улучшение математических функций (более точные аппроксимации)
- [ ] Поддержка множественных исходов в Constant Product
- [ ] Интеграция с off-chain pricing engine
- [ ] LP токены как отдельный контракт
- [ ] Оптимизация gas usage
- [ ] Расширенное тестирование

