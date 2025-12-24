# TON Payout Contract

Смарт-контракт для управления выплатами после разрешения рынков на TON блокчейне.

## Возможности

- ✅ **Проверка разрешения** - Верификация разрешения рынка
- ✅ **Распределение выигрышей** - Автоматическая выплата победителям
- ✅ **Защита от двойных выплат** - Отслеживание уже выплаченных ставок
- ✅ **Batch выплаты** - Массовые выплаты для экономии газа
- ✅ **Обработка комиссий** - Автоматическое взимание и распределение комиссий

## Операции контракта

### OP_CLAIM_PAYOUT (1)
Запрос выплаты для ставки

**Формат сообщения:**
```
op (32 bits) | query_id (64 bits) | bet_id (64 bits) | bet_outcome (8 bits) | bet_amount (coins) | winning_outcome (8 bits) | total_winning (coins) | total_losing (coins)
```

**Проверки:**
- Ставка не должна быть уже выплачена
- Рынок должен быть разрешен
- Ставка должна быть на выигрышный исход
- Минимальная выплата: 0.001 TON

**Результат:**
- Выплата отправляется пользователю
- Ставка помечается как выплаченная
- Комиссия отправляется fee_collector

### OP_BATCH_PAYOUT (2)
Массовая выплата (только админ)

**Формат сообщения:**
```
op (32 bits) | query_id (64 bits) | num_bets (8 bits) | [bet_id (64) | user_address (address) | bet_outcome (8) | bet_amount (coins)] * num_bets | winning_outcome (8) | total_winning (coins) | total_losing (coins)
```

**Проверки:**
- Отправитель должен быть администратором
- Максимум 100 ставок за раз

**Результат:**
- Массовая выплата всех выигрышных ставок
- Экономия газа при множественных выплатах

### OP_VERIFY_RESOLUTION (3)
Проверка разрешения рынка

**Формат сообщения:**
```
op (32 bits) | query_id (64 bits) | market_address (address)
```

**Результат:**
- Возвращает статус разрешения рынка
- Выигрышный исход (если разрешен)

### OP_SET_MARKET_ADDRESS (4)
Установка адреса Market контракта (только админ)

### OP_SET_POOL_ADDRESS (5)
Установка адреса Pool контракта (только админ)

### OP_UPDATE_FEE_RATE (6)
Обновление ставки комиссии (только админ)

## Структура данных

### Payout Data
```
market_address (address) - Адрес Market контракта
pool_address (address) - Адрес Liquidity Pool контракта (опционально)
paid_bets_dict (cell) - Словарь выплаченных ставок
fee_rate (8 bits) - Комиссия в базисных пунктах (200 = 2%)
fee_collector (address) - Адрес для сбора комиссий
admin_address (address) - Адрес администратора
```

### Paid Bets Dictionary
```
Key: hash(user_address, bet_id, market_address) (256 bits)
Value: timestamp (64 bits) - Время выплаты
```

## Защита от двойных выплат

### Механизм защиты

1. **Bet Key**: Уникальный ключ для каждой ставки
   ```
   bet_key = hash(user_address, bet_id, market_address)
   ```

2. **Dictionary Tracking**: Все выплаченные ставки хранятся в словаре
   - При выплате ставка добавляется в словарь
   - При повторной попытке проверяется наличие в словаре

3. **Проверка перед выплатой**:
   ```func
   if (is_bet_paid(paid_bets_dict, bet_key)) {
       throw(200); // Bet already paid
   }
   ```

### Преимущества

- ✅ Гарантированная защита от двойных выплат
- ✅ Эффективное хранение (словарь)
- ✅ Быстрая проверка (O(1))
- ✅ Невозможность обхода (блокчейн-уровень)

## Расчет выплат

### Формула выплаты

```
gross_payout = bet_amount * payout_multiplier
fee = gross_payout * fee_rate / 10000
net_payout = gross_payout - fee
```

### Текущая реализация

Упрощенная модель (1:1 odds):
```
payout = bet_amount * 2 - fee
```

### Будущая реализация

Интеграция с Liquidity Pool для точного расчета через AMM:
```
payout = calculateAMMPayout(bet_amount, market_state, outcome_id) - fee
```

## Интеграция с другими контрактами

### Market Contract

```typescript
// 1. Market Contract разрешает рынок
await marketContract.send(resolveMessage);

// 2. Payout Contract проверяет разрешение
const resolution = await payoutContract.get('verify_resolution', [marketAddress]);

// 3. Пользователь запрашивает выплату
await payoutContract.send(claimPayoutMessage);
```

### Liquidity Pool Contract

```typescript
// Payout Contract может использовать Pool для расчета выплат
const poolPrice = await poolContract.get('calculate_price', [outcomeId]);
const payout = calculatePayoutFromPrice(betAmount, poolPrice);
```

## Get Methods

### get_payout_info()
Возвращает информацию о контракте:
- market_address
- pool_address
- fee_rate

### is_bet_claimed(bet_key)
Проверяет, была ли ставка уже выплачена:
- Возвращает 1 если выплачена
- Возвращает 0 если не выплачена

### get_paid_bets_count()
Возвращает количество выплаченных ставок (placeholder)

## Использование

### Запрос выплаты

```typescript
import { beginCell, Address, toNano } from '@ton/core';

const message = beginCell()
  .storeUint(1, 32) // OP_CLAIM_PAYOUT
  .storeUint(Date.now(), 64)
  .storeUint(betId, 64)
  .storeUint(betOutcome, 8)
  .storeCoins(toNano('10')) // bet_amount
  .storeUint(winningOutcome, 8)
  .storeCoins(toNano('100')) // total_winning
  .storeCoins(toNano('50')) // total_losing
  .endCell();

await payoutContract.send(message);
```

### Проверка разрешения

```typescript
const message = beginCell()
  .storeUint(3, 32) // OP_VERIFY_RESOLUTION
  .storeUint(Date.now(), 64)
  .storeAddress(marketAddress)
  .endCell();

await payoutContract.send(message);
```

### Batch выплата (админ)

```typescript
const message = beginCell()
  .storeUint(2, 32) // OP_BATCH_PAYOUT
  .storeUint(Date.now(), 64)
  .storeUint(numBets, 8)
  // ... bet data for each bet ...
  .storeUint(winningOutcome, 8)
  .storeCoins(totalWinning)
  .storeCoins(totalLosing)
  .endCell();

await payoutContract.send(message);
```

## Безопасность

### Проверки

1. **Двойные выплаты**: Проверка через dictionary
2. **Разрешение рынка**: Верификация статуса рынка
3. **Выигрышный исход**: Проверка соответствия ставки
4. **Минимальная выплата**: Защита от спама
5. **Администратор**: Только админ может менять настройки

### Риски

1. **Неточность расчетов**: Упрощенная модель выплат
2. **Верификация разрешения**: Требует интеграции с Market Contract
3. **Баланс контракта**: Должен быть достаточным для выплат

## Ограничения

1. **Упрощенная модель выплат**: Текущая версия использует 1:1 odds
2. **Верификация разрешения**: Требует off-chain или message passing
3. **Batch размер**: Максимум 100 ставок за раз

## Дальнейшее развитие

- [ ] Интеграция с AMM для точных расчетов
- [ ] Автоматическая верификация разрешения через Market Contract
- [ ] Поддержка множественных валют
- [ ] Оптимизация gas usage
- [ ] Расширенное тестирование
- [ ] Аудит безопасности

