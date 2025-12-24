# Интеграция TON Smart Contracts с Backend

Руководство по интеграции TON смарт-контрактов с NestJS backend.

## Архитектура

```
User → Backend API → TON Contract
                ↓
            Database (sync)
```

Backend выступает как промежуточный слой:
1. Принимает запросы от пользователей
2. Взаимодействует с TON контрактами
3. Синхронизирует состояние с базой данных
4. Обрабатывает события контрактов

## Установка зависимостей

```bash
npm install @ton/core @ton/ton @ton/crypto
```

## Создание сервиса для работы с контрактами

### 1. TON Contract Service

```typescript
// apps/backend/src/ton/ton-contract.service.ts
import { Injectable } from '@nestjs/common';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';

@Injectable()
export class TonContractService {
  private client: TonClient;
  private wallet: WalletContractV4;

  constructor() {
    this.client = new TonClient({
      endpoint: process.env.TON_RPC_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC',
    });
  }

  /**
   * Инициализация кошелька
   */
  async initializeWallet(mnemonic: string[]) {
    const key = await mnemonicToWalletKey(mnemonic);
    this.wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  }

  /**
   * Размещение ставки через контракт
   */
  async placeBet(
    contractAddress: string,
    outcomeId: number,
    betId: string,
    amount: bigint,
  ) {
    const contract = await this.client.open(
      MarketContract.fromAddress(Address.parse(contractAddress))
    );

    const message = beginCell()
      .storeUint(1, 32) // OP_PLACE_BET
      .storeUint(Date.now(), 64) // query_id
      .storeUint(outcomeId, 8)
      .storeUint(parseInt(betId), 64)
      .endCell();

    await contract.send(message, {
      value: amount,
    });

    return { success: true };
  }

  /**
   * Разрешение рынка
   */
  async resolveMarket(
    contractAddress: string,
    winningOutcomeId: number,
  ) {
    const contract = await this.client.open(
      MarketContract.fromAddress(Address.parse(contractAddress))
    );

    const message = beginCell()
      .storeUint(2, 32) // OP_RESOLVE_MARKET
      .storeUint(Date.now(), 64)
      .storeUint(winningOutcomeId, 8)
      .endCell();

    await contract.send(message);

    return { success: true };
  }

  /**
   * Получение информации о рынке
   */
  async getMarketInfo(contractAddress: string) {
    const contract = await this.client.open(
      MarketContract.fromAddress(Address.parse(contractAddress))
    );

    const result = await contract.get('get_market_info', []);
    
    return {
      status: result[0],
      deadline: result[1],
      resolvedOutcome: result[2],
      totalLocked: result[3],
      feeRate: result[4],
    };
  }

  /**
   * Проверка возможности размещения ставки
   */
  async canPlaceBet(contractAddress: string): Promise<boolean> {
    const contract = await this.client.open(
      MarketContract.fromAddress(Address.parse(contractAddress))
    );

    const result = await contract.get('can_place_bet', []);
    return result[0] === 1;
  }
}
```

### 2. Синхронизация состояния

```typescript
// apps/backend/src/ton/ton-sync.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TonContractService } from './ton-contract.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TonSyncService {
  constructor(
    private tonContract: TonContractService,
    private prisma: PrismaService,
  ) {}

  /**
   * Синхронизация состояния рынка с контрактом
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async syncMarketState(marketId: string) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
      include: { contract: true },
    });

    if (!market?.contract?.address) {
      return;
    }

    const contractInfo = await this.tonContract.getMarketInfo(
      market.contract.address
    );

    // Обновление состояния в БД
    await this.prisma.market.update({
      where: { id: marketId },
      data: {
        status: this.mapContractStatus(contractInfo.status),
        totalVolume: contractInfo.totalLocked.toString(),
        resolvedOutcomeId: contractInfo.resolvedOutcome > 0 
          ? await this.getOutcomeId(marketId, contractInfo.resolvedOutcome)
          : null,
      },
    });
  }

  private mapContractStatus(contractStatus: number): string {
    const statusMap = {
      0: 'active',
      1: 'locked',
      2: 'resolved',
      3: 'cancelled',
    };
    return statusMap[contractStatus] || 'active';
  }
}
```

## Интеграция с Bets Service

```typescript
// В apps/backend/src/bets/bets.service.ts

async placeBet(userId: string, placeBetDto: PlaceBetDto) {
  // ... существующая логика ...

  // Если рынок использует TON контракт
  if (market.contract?.address) {
    await this.tonContract.placeBet(
      market.contract.address,
      outcome.id,
      bet.id,
      BigInt(priceCalculation.totalCost.toString()),
    );
  }

  // ... остальная логика ...
}
```

## Мониторинг событий

```typescript
// apps/backend/src/ton/ton-events.service.ts
import { Injectable } from '@nestjs/common';
import { TonClient } from '@ton/ton';

@Injectable()
export class TonEventsService {
  constructor(private client: TonClient) {}

  /**
   * Мониторинг транзакций контракта
   */
  async monitorContract(contractAddress: string) {
    const transactions = await this.client.getTransactions(
      Address.parse(contractAddress),
      { limit: 10 }
    );

    for (const tx of transactions) {
      await this.processTransaction(tx);
    }
  }

  private async processTransaction(tx: any) {
    // Обработка транзакций и обновление БД
  }
}
```

## Конфигурация

В `.env`:
```env
TON_RPC_URL=https://testnet.toncenter.com/api/v2/jsonRPC
TON_WALLET_MNEMONIC=word1 word2 ... word24
TON_NETWORK=testnet # или mainnet
```

## Безопасность

1. **Приватные ключи**: Храните mnemonic в безопасном месте
2. **Валидация**: Всегда валидируйте данные перед отправкой в контракт
3. **Ошибки**: Обрабатывайте ошибки контракта
4. **Синхронизация**: Регулярно синхронизируйте состояние

## Тестирование

```typescript
// Используйте TON testnet для тестирования
const testnetClient = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});
```

