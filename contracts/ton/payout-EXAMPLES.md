# Примеры использования Payout Contract

## Базовые операции

### 1. Инициализация контракта

При деплое нужно передать начальные параметры:
- `market_address` - Адрес Market контракта
- `pool_address` - Адрес Liquidity Pool контракта (опционально)
- `fee_rate` - Комиссия (200 = 2%)
- `fee_collector` - Адрес для сбора комиссий
- `admin_address` - Адрес администратора

### 2. Запрос выплаты (пользователь)

```typescript
import { beginCell, Address, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';

const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

const payoutAddress = Address.parse('YOUR_PAYOUT_CONTRACT_ADDRESS');
const payout = await client.open(
  PayoutContract.fromAddress(payoutAddress)
);

// Параметры ставки
const betId = 12345;
const betOutcome = 1; // Исход ставки
const betAmount = toNano('10'); // 10 TON
const winningOutcome = 1; // Выигрышный исход
const totalWinning = toNano('100'); // Общая сумма выигрышных ставок
const totalLosing = toNano('50'); // Общая сумма проигрышных ставок

// Проверка, не была ли ставка уже выплачена
const betKey = createBetKey(userAddress, betId, marketAddress);
const isClaimed = await payout.get('is_bet_claimed', [
  { type: 'int', value: betKey }
]);

if (isClaimed[0] === 1) {
  throw new Error('Bet already claimed');
}

// Запрос выплаты
const message = beginCell()
  .storeUint(1, 32) // OP_CLAIM_PAYOUT
  .storeUint(Date.now(), 64)
  .storeUint(betId, 64)
  .storeUint(betOutcome, 8)
  .storeCoins(betAmount)
  .storeUint(winningOutcome, 8)
  .storeCoins(totalWinning)
  .storeCoins(totalLosing)
  .endCell();

await payout.send(message);
```

### 3. Проверка разрешения рынка

```typescript
const message = beginCell()
  .storeUint(3, 32) // OP_VERIFY_RESOLUTION
  .storeUint(Date.now(), 64)
  .storeAddress(marketAddress)
  .endCell();

await payout.send(message);

// Ответ придет в виде сообщения обратно
// В production, используйте get method или message callback
```

### 4. Batch выплата (админ)

```typescript
// Подготовка данных о ставках
const bets = [
  {
    betId: 12345,
    userAddress: Address.parse('EQD...'),
    betOutcome: 1,
    betAmount: toNano('10'),
  },
  {
    betId: 12346,
    userAddress: Address.parse('EQD...'),
    betOutcome: 1,
    betAmount: toNano('20'),
  },
  // ... до 100 ставок
];

// Создание сообщения
let message = beginCell()
  .storeUint(2, 32) // OP_BATCH_PAYOUT
  .storeUint(Date.now(), 64)
  .storeUint(bets.length, 8); // num_bets

// Добавление данных о каждой ставке
for (const bet of bets) {
  message = message
    .storeUint(bet.betId, 64)
    .storeAddress(bet.userAddress)
    .storeUint(bet.betOutcome, 8)
    .storeCoins(bet.betAmount);
}

// Добавление данных о разрешении
message = message
  .storeUint(winningOutcome, 8)
  .storeCoins(totalWinning)
  .storeCoins(totalLosing)
  .endCell();

await payout.send(message);
```

## Интеграция с Market Contract

### Полный цикл выплаты

```typescript
// 1. Market Contract разрешает рынок
const resolveMessage = beginCell()
  .storeUint(2, 32) // OP_RESOLVE_MARKET
  .storeUint(Date.now(), 64)
  .storeUint(winningOutcome, 8)
  .endCell();

await marketContract.send(resolveMessage);

// 2. Получение информации о разрешении
const marketInfo = await marketContract.get('get_market_info', []);
const resolvedOutcome = marketInfo[2];
const totalLocked = marketInfo[3];

// 3. Пользователь запрашивает выплату
const claimMessage = beginCell()
  .storeUint(1, 32) // OP_CLAIM_PAYOUT
  .storeUint(Date.now(), 64)
  .storeUint(betId, 64)
  .storeUint(betOutcome, 8)
  .storeCoins(betAmount)
  .storeUint(resolvedOutcome, 8)
  .storeCoins(totalWinning)
  .storeCoins(totalLosing)
  .endCell();

await payoutContract.send(claimMessage);
```

## Интеграция с Backend

### Backend синхронизация

```typescript
// Backend отслеживает разрешение рынка
async function onMarketResolved(marketId: string, winningOutcomeId: string) {
  // 1. Получить все выигрышные ставки
  const winningBets = await prisma.bet.findMany({
    where: {
      marketId,
      outcomeId: winningOutcomeId,
      status: 'active',
    },
  });

  // 2. Для каждой ставки создать выплату
  for (const bet of winningBets) {
    // Проверить, не была ли уже выплачена
    const betKey = createBetKey(bet.userId, bet.id, marketAddress);
    const isClaimed = await payoutContract.get('is_bet_claimed', [betKey]);
    
    if (isClaimed[0] === 0) {
      // Создать выплату в БД
      await prisma.payout.create({
        data: {
          betId: bet.id,
          amount: calculatePayout(bet),
          status: 'pending',
        },
      });
    }
  }

  // 3. Пользователь может запросить выплату через контракт
  // Или админ может выполнить batch выплату
}
```

### Автоматическая выплата через Backend

```typescript
async function processPayouts(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { contract: true },
  });

  if (!market || market.status !== 'resolved') {
    return;
  }

  // Получить все выигрышные ставки
  const winningBets = await prisma.bet.findMany({
    where: {
      marketId,
      outcomeId: market.resolvedOutcomeId,
      status: 'active',
    },
  });

  // Batch выплата (если админ)
  if (winningBets.length > 0 && winningBets.length <= 100) {
    const batchMessage = createBatchPayoutMessage(winningBets, market);
    await payoutContract.send(batchMessage);
  }
}
```

## Обработка ошибок

```typescript
try {
  await payoutContract.send(claimMessage);
} catch (error) {
  // Коды ошибок:
  // 100: Division by zero
  // 200: Bet already paid
  // 201: Market not resolved
  // 202: Bet not for winning outcome
  // 203: Payout too small
  // 204: Insufficient contract balance
  // 300-399: Ошибки batch выплаты
  // 400-699: Ошибки административных операций
  // 999: Неизвестная операция
  
  if (error.code === 200) {
    console.log('Bet already claimed');
  } else if (error.code === 201) {
    console.log('Market not resolved yet');
  } else if (error.code === 202) {
    console.log('Bet is not for winning outcome');
  } else {
    console.error('Payout error:', error);
  }
}
```

## Best Practices

### 1. Всегда проверяйте разрешение перед выплатой

```typescript
const marketInfo = await marketContract.get('get_market_info', []);
if (marketInfo[0] !== 2) { // 2 = RESOLVED
  throw new Error('Market not resolved');
}
```

### 2. Проверяйте, не была ли ставка уже выплачена

```typescript
const betKey = createBetKey(userAddress, betId, marketAddress);
const isClaimed = await payoutContract.get('is_bet_claimed', [betKey]);
if (isClaimed[0] === 1) {
  return; // Already claimed
}
```

### 3. Используйте batch выплаты для экономии газа

```typescript
// Вместо множественных отдельных выплат
// Используйте одну batch выплату
if (bets.length > 1) {
  await payoutContract.send(batchMessage);
} else {
  await payoutContract.send(singleMessage);
}
```

### 4. Мониторьте баланс контракта

```typescript
const contractBalance = await client.getBalance(payoutAddress);
const totalPayouts = calculateTotalPayouts(pendingBets);

if (contractBalance < totalPayouts) {
  console.warn('Insufficient contract balance');
  // Пополнить баланс контракта
}
```

## Расчет выплат

### Упрощенная модель (текущая)

```typescript
function calculatePayout(betAmount: bigint, feeRate: number): bigint {
  const grossPayout = betAmount * 2n; // 1:1 odds
  const fee = (grossPayout * BigInt(feeRate)) / 10000n;
  return grossPayout - fee;
}
```

### Будущая модель (с AMM)

```typescript
import { PricingService } from '@polymarket/pricing-engine';

async function calculatePayoutWithAMM(
  bet: Bet,
  marketState: MarketState,
): Promise<bigint> {
  // Получить цену из Pool
  const price = await poolContract.get('calculate_price', [bet.outcomeId]);
  
  // Рассчитать выплату через AMM
  const payout = PricingService.calculatePayout(
    marketState,
    bet.outcomeId,
    bet.shares,
  );
  
  return toNano(payout.toString());
}
```

## Мониторинг

### Отслеживание выплат

```typescript
// Периодически проверяйте статус выплат
setInterval(async () => {
  const payoutInfo = await payoutContract.get('get_payout_info', []);
  console.log('Payout contract info:', {
    marketAddress: payoutInfo[0].toString(),
    poolAddress: payoutInfo[1].toString(),
    feeRate: payoutInfo[2],
  });
  
  // Проверьте баланс
  const balance = await client.getBalance(payoutAddress);
  console.log('Contract balance:', balance / 1e9, 'TON');
}, 60000); // Каждую минуту
```

