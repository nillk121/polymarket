# Bets Module

Модуль для размещения и управления ставками.

## Возможности

- ✅ Размещение ставок (buy/sell)
- ✅ Блокировка баланса пользователя
- ✅ Обновление пула ликвидности
- ✅ Соблюдение дедлайнов
- ✅ Защита от двойного расходования
- ✅ Real-time обновления через WebSocket

## Поток транзакций

### Размещение ставки

1. **Валидация данных**
   - Проверка рынка (существует, активен)
   - Проверка дедлайна (endDate)
   - Проверка исхода (существует, не разрешен)
   - Проверка кошелька (принадлежит пользователю, активен)

2. **Расчет цены**
   - Использование Pricing Engine (LMSR или Constant Product)
   - Расчет количества акций или стоимости
   - Проверка проскальзывания

3. **Защита от двойного расходования**
   - Проверка дублирующих транзакций
   - Блокировка баланса

4. **Создание транзакции**
   - Запись транзакции в БД
   - Статус: pending

5. **Создание ставки**
   - Запись ставки в БД
   - Статус: pending

6. **Обновление пула ликвидности**
   - Обновление shares исхода
   - Обновление totalVolume исхода
   - Обновление totalVolume и totalBets рынка

7. **Списание средств**
   - Разблокировка и списание баланса
   - Обновление транзакции (статус: completed)

8. **Активация ставки**
   - Обновление статуса ставки: active

9. **Real-time обновления**
   - Отправка события bet:placed пользователю
   - Отправка события bet:new всем подписанным на рынок
   - Отправка обновления цен

## API Endpoints

### POST /bets
Размещение ставки

**Request:**
```json
{
  "marketId": "market-uuid",
  "outcomeId": "outcome-uuid",
  "walletId": "wallet-uuid",
  "type": "buy",
  "shares": 10,
  "maxSlippage": 5,
  "referralCode": "optional-code"
}
```

**Response:**
```json
{
  "id": "bet-uuid",
  "userId": "user-uuid",
  "marketId": "market-uuid",
  "outcomeId": "outcome-uuid",
  "shares": "10",
  "price": "0.52",
  "totalCost": "5.2",
  "status": "active",
  "market": { ... },
  "outcome": { ... }
}
```

### POST /bets/:id/cancel
Отмена ставки

**Request:**
```json
{
  "reason": "Changed my mind"
}
```

### GET /bets
Получение ставок пользователя

**Query params:**
- `page` - номер страницы
- `limit` - количество на странице
- `status` - фильтр по статусу
- `marketId` - фильтр по рынку
- `outcomeId` - фильтр по исходу

### GET /bets/:id
Получение ставки по ID

## WebSocket Events

### Подключение

```typescript
const socket = io('http://localhost:3000/bets', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Подписка на рынок

```typescript
socket.emit('subscribe:market', { marketId: 'market-uuid' });
```

### События

**bet:placed** - Ставка размещена
```json
{
  "id": "bet-uuid",
  "marketId": "market-uuid",
  "outcomeId": "outcome-uuid",
  "shares": "10",
  "price": "0.52",
  "totalCost": "5.2"
}
```

**bet:new** - Новая ставка на рынке (для всех подписанных)
```json
{
  "betId": "bet-uuid",
  "marketId": "market-uuid",
  "outcomeId": "outcome-uuid",
  "shares": "10",
  "price": "0.52",
  "totalCost": "5.2",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**bet:cancelled** - Ставка отменена
```json
{
  "betId": "bet-uuid",
  "marketId": "market-uuid"
}
```

**market:prices** - Обновление цен исходов
```json
{
  "marketId": "market-uuid",
  "prices": {
    "outcome-1": 0.52,
    "outcome-2": 0.48
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**market:resolved** - Рынок разрешен
```json
{
  "marketId": "market-uuid",
  "resolvedOutcomeId": "outcome-uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Защита от двойного расходования

1. **Проверка дублирующих транзакций**
   - Поиск транзакций с теми же параметрами за последние 5 секунд
   - Если найдена - отклонение запроса

2. **Блокировка баланса**
   - Атомарная операция через транзакцию БД
   - Проверка доступного баланса перед блокировкой

3. **Транзакции БД**
   - Все операции в одной транзакции
   - Откат при ошибке

## Статусы ставок

- **pending** - Ставка создана, ожидает обработки
- **active** - Ставка активна, ожидает разрешения рынка
- **won** - Ставка выиграла
- **lost** - Ставка проиграла
- **cancelled** - Ставка отменена
- **refunded** - Ставка возвращена

## Примеры использования

### Размещение ставки на определенное количество акций

```typescript
POST /bets
{
  "marketId": "market-uuid",
  "outcomeId": "outcome-uuid",
  "walletId": "wallet-uuid",
  "type": "buy",
  "shares": 10,
  "maxSlippage": 5
}
```

### Размещение ставки на определенную сумму

```typescript
POST /bets
{
  "marketId": "market-uuid",
  "outcomeId": "outcome-uuid",
  "walletId": "wallet-uuid",
  "type": "buy",
  "cost": 100,
  "maxSlippage": 5
}
```

### Подписка на обновления через WebSocket

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/bets', {
  auth: { token: 'jwt-token' }
});

socket.on('connect', () => {
  socket.emit('subscribe:market', { marketId: 'market-uuid' });
});

socket.on('bet:new', (data) => {
  console.log('New bet:', data);
});

socket.on('market:prices', (data) => {
  console.log('Price update:', data);
});
```

