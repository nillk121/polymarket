# Примеры использования TON Market Contract

## Размещение ставки

### TypeScript (Backend)

```typescript
import { beginCell, Address, toNano } from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';

const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

const contractAddress = Address.parse('EQD...'); // Адрес контракта
const contract = await client.open(MarketContract.fromAddress(contractAddress));

// Размещение ставки
const outcomeId = 1; // ID исхода
const betId = Date.now(); // Уникальный ID ставки
const betAmount = toNano('10'); // 10 TON

const message = beginCell()
  .storeUint(1, 32) // OP_PLACE_BET
  .storeUint(Date.now(), 64) // query_id
  .storeUint(outcomeId, 8)
  .storeUint(betId, 64)
  .endCell();

await contract.send(message, {
  value: betAmount,
});
```

### JavaScript (Frontend)

```javascript
import { TonConnectUI } from '@tonconnect/ui';

const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://your-app.com/tonconnect-manifest.json',
});

// Подключение кошелька
await tonConnectUI.connectWallet();

// Размещение ставки
const contractAddress = 'EQD...';
const outcomeId = 1;
const betId = Date.now();
const betAmount = '10000000000'; // 10 TON в nanoTON

const transaction = {
  to: contractAddress,
  value: betAmount,
  body: beginCell()
    .storeUint(1, 32) // OP_PLACE_BET
    .storeUint(Date.now(), 64)
    .storeUint(outcomeId, 8)
    .storeUint(betId, 64)
    .endCell()
    .toBoc()
    .toString('base64'),
};

await tonConnectUI.sendTransaction({
  messages: [transaction],
});
```

## Разрешение рынка (Админ)

```typescript
const message = beginCell()
  .storeUint(2, 32) // OP_RESOLVE_MARKET
  .storeUint(Date.now(), 64)
  .storeUint(winningOutcomeId, 8) // ID выигрышного исхода
  .endCell();

await contract.send(message);
```

## Вывод выигрышей

```typescript
const message = beginCell()
  .storeUint(3, 32) // OP_WITHDRAW_WINNINGS
  .storeUint(Date.now(), 64)
  .storeUint(betId, 64) // ID ставки
  .endCell();

await contract.send(message);
```

## Получение информации о рынке

```typescript
// Get method
const result = await contract.get('get_market_info', []);

console.log({
  status: result[0], // 0=active, 1=locked, 2=resolved, 3=cancelled
  deadline: result[1], // Unix timestamp
  resolvedOutcome: result[2], // 0 if not resolved
  totalLocked: result[3], // Total locked funds in nanoTON
  feeRate: result[4], // Fee rate in basis points
});

// Проверка возможности размещения ставки
const canBet = await contract.get('can_place_bet', []);
console.log('Can place bet:', canBet[0] === 1);

// Получение общей суммы по исходу
const outcomeTotal = await contract.get('get_outcome_total', [
  { type: 'int', value: outcomeId }
]);
console.log('Outcome total:', outcomeTotal[0]);
```

## Отмена рынка (Админ)

```typescript
const message = beginCell()
  .storeUint(4, 32) // OP_CANCEL_MARKET
  .storeUint(Date.now(), 64)
  .endCell();

await contract.send(message);
```

## Возврат средств (для отмененных рынков)

```typescript
const message = beginCell()
  .storeUint(5, 32) // OP_REFUND_BETS
  .storeUint(Date.now(), 64)
  .storeUint(betId, 64) // ID ставки
  .endCell();

await contract.send(message);
```

## Обработка ошибок

```typescript
try {
  await contract.send(message, { value: betAmount });
} catch (error) {
  // Коды ошибок:
  // 100: Market not active
  // 101: Deadline passed
  // 102: Bet amount too low
  // 200: Not admin
  // 201: Market already resolved
  // 300: Market not resolved
  // 301: No resolved outcome
  // 302: Bet not found
  // 303: Bet not for winning outcome
  
  console.error('Contract error:', error);
}
```

## Мониторинг транзакций

```typescript
const transactions = await client.getTransactions(contractAddress, {
  limit: 10,
});

for (const tx of transactions) {
  console.log('Transaction:', {
    hash: tx.hash().toString(),
    lt: tx.lt,
    from: tx.inMessage?.info.src?.toString(),
    value: tx.inMessage?.info.value?.coins.toString(),
  });
}
```

## Интеграция с Backend

```typescript
// apps/backend/src/bets/bets.service.ts

async placeBet(userId: string, placeBetDto: PlaceBetDto) {
  // ... валидация ...

  // Создание ставки в БД
  const bet = await this.prisma.bet.create({ ... });

  // Если рынок использует TON контракт
  if (market.contractAddress) {
    try {
      await this.tonContract.placeBet(
        market.contractAddress,
        outcome.id,
        bet.id,
        BigInt(priceCalculation.totalCost.toString()),
      );
      
      // Обновление статуса ставки
      await this.prisma.bet.update({
        where: { id: bet.id },
        data: { status: 'active' },
      });
    } catch (error) {
      // Откат ставки в БД
      await this.prisma.bet.delete({ where: { id: bet.id } });
      throw new BadRequestException('Failed to place bet on contract');
    }
  }

  return bet;
}
```

