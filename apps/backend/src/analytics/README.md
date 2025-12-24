# Analytics Module

Модуль продвинутой аналитики для платформы прогнозных рынков.

## Возможности

- ✅ Отслеживание источников трафика (канал, пост, deep link)
- ✅ Анализ времени ставок (по часам дня)
- ✅ Популярные рынки (просмотры, ставки, конверсия)
- ✅ Глубина ликвидности по рынкам
- ✅ Когорты пользователей (анализ удержания)
- ✅ DAU / MAU (Daily/Monthly Active Users)
- ✅ Воронки конверсии
- ✅ Полный дашборд аналитики

## API Endpoints

### POST /analytics/track
Отслеживание события (публичный endpoint)

**Request:**
```json
{
  "eventType": "market_view",
  "userId": "user-uuid",
  "marketId": "market-uuid",
  "trafficSourceId": "source-uuid",
  "sessionId": "session-id",
  "metadata": {
    "customField": "value"
  }
}
```

### GET /analytics/stats
Базовая статистика (admin/analyst)

**Response:**
```json
{
  "totalEvents": 1000,
  "totalUsers": 500,
  "totalMarkets": 50,
  "totalBets": 2000
}
```

### GET /analytics/traffic-sources
Источники трафика

**Query Parameters:**
- `startDate` - Начальная дата (ISO)
- `endDate` - Конечная дата (ISO)
- `trafficSourceId` - ID источника трафика

**Response:**
```json
[
  {
    "id": "source-uuid",
    "name": "Telegram Channel",
    "type": "telegram",
    "totalEvents": 500,
    "uniqueUsers": 200
  }
]
```

### GET /analytics/bet-timing
Время ставок по часам дня

**Query Parameters:**
- `startDate` - Начальная дата
- `endDate` - Конечная дата

**Response:**
```json
[
  { "hour": 0, "count": 10 },
  { "hour": 1, "count": 5 },
  ...
]
```

### GET /analytics/popular-markets
Популярные рынки

**Query Parameters:**
- `startDate` - Начальная дата
- `endDate` - Конечная дата
- `limit` - Количество результатов (по умолчанию 20)

**Response:**
```json
[
  {
    "marketId": "market-uuid",
    "title": "Биткоин достигнет $100k?",
    "views": 1000,
    "bets": 200,
    "uniqueViewers": 500,
    "uniqueBettors": 150,
    "conversionRate": 30.0
  }
]
```

### GET /analytics/liquidity-depth
Глубина ликвидности

**Query Parameters:**
- `marketId` - ID рынка (опционально)

**Response:**
```json
[
  {
    "marketId": "market-uuid",
    "title": "Биткоин достигнет $100k?",
    "totalLiquidity": 10000.0,
    "outcomes": [
      {
        "outcomeId": "outcome-uuid",
        "title": "Да",
        "liquidity": 6000.0,
        "percentage": 60.0
      },
      {
        "outcomeId": "outcome-uuid",
        "title": "Нет",
        "liquidity": 4000.0,
        "percentage": 40.0
      }
    ]
  }
]
```

### GET /analytics/user-cohorts
Когорты пользователей

**Query Parameters:**
- `startDate` - Начальная дата
- `endDate` - Конечная дата

**Response:**
```json
[
  {
    "cohort": "2024-01-01",
    "users": 100,
    "activity": [
      {
        "week": 0,
        "bets": 50,
        "retention": 50.0
      },
      {
        "week": 1,
        "bets": 30,
        "retention": 30.0
      }
    ]
  }
]
```

### GET /analytics/dau-mau
DAU / MAU метрики

**Query Parameters:**
- `startDate` - Начальная дата
- `endDate` - Конечная дата

**Response:**
```json
{
  "dau": [
    { "date": "2024-01-01", "dau": 100 },
    { "date": "2024-01-02", "dau": 120 }
  ],
  "mau": 500,
  "avgDAU": 110,
  "stickiness": 22.0
}
```

### GET /analytics/conversion-funnel
Воронка конверсии

**Query Parameters:**
- `startDate` - Начальная дата
- `endDate` - Конечная дата

**Response:**
```json
[
  {
    "stage": "Просмотр рынка",
    "eventType": "market_view",
    "count": 1000,
    "conversion": 100.0
  },
  {
    "stage": "Просмотр деталей",
    "eventType": "market_detail_view",
    "count": 500,
    "conversion": 50.0
  },
  {
    "stage": "Начало ставки",
    "eventType": "bet_initiated",
    "count": 200,
    "conversion": 40.0
  },
  {
    "stage": "Завершение ставки",
    "eventType": "bet_placed",
    "count": 150,
    "conversion": 75.0
  }
]
```

### GET /analytics/dashboard
Полный дашборд аналитики

**Query Parameters:**
- `startDate` - Начальная дата
- `endDate` - Конечная дата

**Response:**
```json
{
  "stats": { ... },
  "trafficSources": [ ... ],
  "betTiming": [ ... ],
  "popularMarkets": [ ... ],
  "liquidityDepth": [ ... ],
  "dauMau": { ... },
  "conversionFunnel": [ ... ]
}
```

## Типы событий

Рекомендуемые типы событий для отслеживания:

- `market_view` - Просмотр списка рынков
- `market_detail_view` - Просмотр деталей рынка
- `bet_initiated` - Начало создания ставки
- `bet_placed` - Завершение ставки
- `deposit` - Пополнение баланса
- `withdrawal` - Вывод средств
- `post_view` - Просмотр поста
- `post_click` - Клик по ссылке в посте
- `channel_view` - Просмотр канала
- `deeplink_click` - Клик по deep link

## Использование

### Отслеживание события

```typescript
await analyticsService.trackEvent({
  eventType: 'market_view',
  userId: 'user-uuid',
  marketId: 'market-uuid',
  trafficSourceId: 'source-uuid',
  metadata: {
    category: 'crypto',
  },
});
```

### Получение аналитики

```typescript
// DAU/MAU
const dauMau = await analyticsService.getDAUMAU({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});

// Воронка конверсии
const funnel = await analyticsService.getConversionFunnel({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});

// Полный дашборд
const dashboard = await analyticsService.getDashboard({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```

## Интеграция с фронтендом

В админ-панели доступны следующие страницы:

- `/analytics` - Основной дашборд аналитики
- `/analytics/cohorts` - Когорты пользователей

Все страницы поддерживают фильтрацию по датам и визуализацию данных с помощью Recharts.

