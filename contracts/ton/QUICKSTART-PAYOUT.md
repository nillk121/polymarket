# Quick Start - Payout Contract

Быстрое руководство по использованию TON Payout Contract.

## Компиляция

```bash
cd contracts/ton

# Компиляция контракта выплат
func -SPA stdlib.fc payout.fc -o payout.fif
```

## Деплой

```bash
toncli deploy payout.fif --testnet
```

При деплое нужно передать начальные данные:
- `market_address` - Адрес Market контракта
- `pool_address` - Адрес Liquidity Pool контракта (опционально)
- `fee_rate` - Комиссия в базисных пунктах (200 = 2%)
- `fee_collector` - Адрес для сбора комиссий
- `admin_address` - Адрес администратора

## Базовое использование

### 1. Запрос выплаты (пользователь)

```typescript
import { beginCell, toNano } from '@ton/core';

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

await payout.send(message);
```

### 2. Проверка, не была ли ставка уже выплачена

```typescript
// Создайте bet_key
const betKey = createBetKey(userAddress, betId, marketAddress);

// Проверьте статус
const isClaimed = await payout.get('is_bet_claimed', [
  { type: 'int', value: betKey }
]);

if (isClaimed[0] === 1) {
  console.log('Bet already claimed');
}
```

### 3. Получение информации о контракте

```typescript
const info = await payout.get('get_payout_info', []);

console.log({
  marketAddress: info[0].toString(),
  poolAddress: info[1].toString(),
  feeRate: info[2], // в basis points
});
```

## Полный цикл

### 1. Market разрешается

```typescript
await marketContract.send(resolveMessage);
```

### 2. Пользователь запрашивает выплату

```typescript
await payoutContract.send(claimPayoutMessage);
```

### 3. Контракт проверяет и выплачивает

- ✅ Проверяет, что ставка не была выплачена
- ✅ Проверяет разрешение рынка
- ✅ Проверяет выигрышный исход
- ✅ Рассчитывает выплату
- ✅ Вычитает комиссию
- ✅ Отправляет выплату пользователю
- ✅ Помечает ставку как выплаченную

## Batch выплата (админ)

Для множественных выплат используйте batch операцию:

```typescript
const message = beginCell()
  .storeUint(2, 32) // OP_BATCH_PAYOUT
  .storeUint(Date.now(), 64)
  .storeUint(numBets, 8) // до 100 ставок
  // ... данные о ставках ...
  .endCell();

await payout.send(message);
```

## Документация

- `payout-README.md` - Полная документация
- `payout-EXAMPLES.md` - Примеры использования
- `INTEGRATION-GUIDE.md` - Интеграция с другими контрактами

## Важные замечания

1. **Защита от двойных выплат**: Контракт автоматически отслеживает выплаченные ставки
2. **Проверка разрешения**: Убедитесь, что рынок разрешен перед выплатой
3. **Баланс контракта**: Контракт должен иметь достаточный баланс для выплат
4. **Комиссии**: Автоматически вычитаются и отправляются fee_collector

