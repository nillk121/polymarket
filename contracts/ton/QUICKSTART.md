# Quick Start Guide - TON Market Contract

Быстрое руководство по использованию TON Market Contract.

## Установка инструментов

### 1. Установка FunC и Fift

```bash
# macOS
brew install ton

# Linux (через Docker)
docker pull tonlabs/func
docker pull tonlabs/fift

# Или скомпилируйте из исходников
# https://github.com/ton-blockchain/ton
```

### 2. Установка TON CLI

```bash
npm install -g @ton/ton toncli
```

## Компиляция контракта

```bash
cd contracts/ton

# Компиляция базовой версии
func -SPA stdlib.fc market.fc -o market.fif

# Компиляция расширенной версии (рекомендуется)
func -SPA stdlib.fc market-v2.fc -o market-v2.fif
```

## Деплой на Testnet

### 1. Создание кошелька

```bash
toncli genaddr market-v2.fif
```

### 2. Пополнение кошелька

Получите тестовые TON на https://t.me/testgiver_ton_bot

### 3. Деплой

```bash
toncli deploy market-v2.fif --testnet
```

При деплое нужно передать начальные данные:
- `admin_address` - адрес администратора
- `deadline` - Unix timestamp дедлайна
- `fee_rate` - комиссия (200 = 2%)
- `fee_collector` - адрес для сбора комиссий

## Использование

### Размещение ставки

```typescript
import { beginCell, Address, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';

const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

const contract = await client.open(
  MarketContract.fromAddress(Address.parse('YOUR_CONTRACT_ADDRESS'))
);

const message = beginCell()
  .storeUint(1, 32) // OP_PLACE_BET
  .storeUint(Date.now(), 64)
  .storeUint(1, 8) // outcome_id
  .storeUint(12345, 64) // bet_id
  .endCell();

await contract.send(message, {
  value: toNano('10'), // 10 TON
});
```

### Получение информации

```typescript
const info = await contract.get('get_market_info', []);
console.log('Status:', info[0]);
console.log('Deadline:', new Date(info[1] * 1000));
console.log('Total Locked:', info[3] / 1e9, 'TON');
```

## Структура проекта

```
contracts/ton/
├── market.fc          # Базовая версия контракта
├── market-v2.fc       # Расширенная версия (рекомендуется)
├── deploy.fif         # Скрипт деплоя
├── test.fif          # Тестовый скрипт
├── imports/
│   └── stdlib.fc     # Стандартная библиотека
├── README.md         # Основная документация
├── EXAMPLES.md       # Примеры использования
├── INTEGRATION.md    # Интеграция с backend
├── ARCHITECTURE.md   # Архитектура контракта
├── SECURITY.md       # Безопасность
└── QUICKSTART.md     # Это руководство
```

## Следующие шаги

1. Прочитайте `README.md` для полной документации
2. Изучите `EXAMPLES.md` для примеров кода
3. Ознакомьтесь с `SECURITY.md` перед деплоем в mainnet
4. Интегрируйте с backend используя `INTEGRATION.md`

## Поддержка

При возникновении проблем:
1. Проверьте документацию TON: https://docs.ton.org
2. Изучите примеры в `EXAMPLES.md`
3. Проверьте логи компиляции

