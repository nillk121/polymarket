# Market Resolution Authority Module

Модуль управления разрешениями рынков с поддержкой споров и внешних оракулов.

## Возможности

- ✅ Разрешение рынков администраторами
- ✅ Окно для споров (dispute window)
- ✅ Система споров пользователей
- ✅ Рассмотрение споров администраторами
- ✅ Поддержка внешних оракулов (интерфейс для будущей интеграции)
- ✅ Полные аудит-логи всех действий

## Жизненный цикл разрешения

```
pending → confirmed → (market resolved)
  ↓
disputed → (review) → pending/confirmed
```

### Статусы разрешения

- **pending** - Ожидает подтверждения (окно споров открыто)
- **confirmed** - Подтверждено, рынок разрешен
- **disputed** - Оспорено пользователями
- **final** - Финальное разрешение (после всех споров)

## API Endpoints

### POST /market-resolutions/markets/:marketId/resolve
Создание разрешения рынка (только админ)

**Request:**
```json
{
  "resolvedOutcomeId": "outcome-uuid",
  "resolutionNotes": "Рынок разрешен на основе официальных данных",
  "resolutionDate": "2024-12-31T12:00:00Z",
  "oracleId": "oracle-uuid", // опционально
  "disputeWindowHours": 24 // опционально, по умолчанию 24
}
```

### POST /market-resolutions/:id/confirm
Подтверждение разрешения после окончания окна споров (только админ)

### POST /market-resolutions/:id/disputes
Создание спора (авторизованные пользователи)

**Request:**
```json
{
  "disputedOutcomeId": "outcome-uuid",
  "reason": "Данный исход неверен, так как...",
  "evidence": {
    "screenshots": ["url1", "url2"],
    "links": ["https://example.com"]
  }
}
```

### PUT /market-resolutions/disputes/:disputeId/review
Рассмотрение спора (только админ)

**Request:**
```json
{
  "decision": "accepted", // или "rejected"
  "reviewNotes": "Спор принят, исход изменен"
}
```

### GET /market-resolutions/:id
Получение разрешения с деталями

### GET /market-resolutions
Получение всех разрешений (admin/analyst)

**Query Parameters:**
- `marketId` - ID рынка
- `status` - Статус разрешения
- `page` - Номер страницы
- `limit` - Количество на странице

### GET /market-resolutions/:id/audit-logs
Получение аудит-логов разрешения

## Окно споров (Dispute Window)

После создания разрешения открывается окно споров (по умолчанию 24 часа).

- В течение этого времени пользователи могут оспорить разрешение
- После закрытия окна администратор может подтвердить разрешение
- Если есть открытые споры, подтверждение невозможно

## Система споров

### Создание спора

Любой авторизованный пользователь может создать спор:
- Указать альтернативный исход
- Предоставить причину
- Приложить доказательства (URLs, скриншоты)

### Рассмотрение спора

Администратор может:
- **Принять** спор - исход разрешения изменяется, статус возвращается в `pending`
- **Отклонить** спор - спор закрывается, разрешение остается без изменений

## Внешние оракулы

### Интерфейс оракула

```typescript
interface IOracle {
  id: string;
  name: string;
  type: string; // chainlink, band, custom, api
  
  resolveMarket(marketId: string, params?: any): Promise<{
    outcomeId: string;
    confidence: number;
    data: any;
  }>;
  
  isAvailable(): Promise<boolean>;
}
```

### Типы оракулов

- **chainlink** - Chainlink Oracle
- **band** - Band Protocol
- **custom** - Кастомный оракул
- **api** - API-based оракул

### Использование оракула

При создании разрешения можно указать `oracleId`. В этом случае:
- `resolutionSource` будет установлен в `oracle`
- В будущем можно автоматически получать данные от оракула

## Аудит-логи

Все действия с разрешениями логируются:

- `created` - Создание разрешения
- `updated` - Обновление разрешения
- `disputed` - Создание спора
- `confirmed` - Подтверждение разрешения
- `updated_after_dispute` - Обновление после принятия спора

Каждый лог содержит:
- Действие
- Пользователя, выполнившего действие
- Старые и новые значения
- IP адрес и User Agent
- Метаданные

## Примеры использования

### Создание разрешения

```typescript
await resolutionService.createResolution(
  marketId,
  {
    resolvedOutcomeId: 'outcome-uuid',
    resolutionNotes: 'Рынок разрешен',
    disputeWindowHours: 48,
  },
  adminUserId,
);
```

### Создание спора

```typescript
await resolutionService.createDispute(
  resolutionId,
  {
    disputedOutcomeId: 'alternative-outcome-uuid',
    reason: 'Исход неверен',
    evidence: {
      links: ['https://example.com/proof'],
    },
  },
  userId,
);
```

### Рассмотрение спора

```typescript
await resolutionService.reviewDispute(
  disputeId,
  {
    decision: 'accepted',
    reviewNotes: 'Спор принят',
  },
  adminUserId,
);
```

## Интеграция с Markets Module

Разрешение рынка через этот модуль:
1. Создает запись `MarketResolution`
2. Обновляет статус рынка на `locked`
3. После подтверждения обновляет статус на `resolved`
4. Запускает процесс выплат

## Безопасность

- Только администраторы могут создавать и подтверждать разрешения
- Только администраторы могут рассматривать споры
- Все действия логируются с IP и User Agent
- Окно споров защищает от преждевременного подтверждения

