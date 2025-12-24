# Security & Abuse Prevention Module

Модуль безопасности и предотвращения злоупотреблений.

## Возможности

- ✅ Расширенный rate limiting (per-user лимиты)
- ✅ Обнаружение множественных аккаунтов
- ✅ Обнаружение подозрительных ставок
- ✅ Экстренная заморозка рынков
- ✅ Полные аудит-логи безопасности

## Компоненты

### 1. Rate Limiting

Расширенный rate limiting с поддержкой:
- Per-user лимиты (зависит от risk score)
- Per-endpoint лимиты
- Автоматическое логирование превышений

**Использование:**
```typescript
@UseGuards(EnhancedRateLimitGuard)
@Throttle(10, 60) // 10 requests per minute
@Get('endpoint')
async endpoint() {}
```

### 2. Multi-Account Detection

Автоматическое обнаружение множественных аккаунтов по:
- IP адресам
- Browser/device fingerprints
- Паттернам ставок
- Временным паттернам

**Анализ:**
- Запускается автоматически каждые 6 часов
- Можно запустить вручную через API
- Создает кластеры с уровнем уверенности

### 3. Suspicious Betting Detection

Обнаружение подозрительных ставок по:
- Скорости ставок (velocity)
- Необычным суммам
- Паттернам ставок
- Времени ставок
- Статусу рынка

**Risk Score:**
- 0-69: Низкий риск
- 70-89: Средний риск (требует проверки)
- 90-100: Высокий риск (блокировка)

### 4. Market Freeze

Экстренная заморозка рынков:
- Ручная заморозка отдельного рынка
- Экстренная заморозка всех рынков
- Автоматическая блокировка ставок на замороженных рынках

**Типы заморозки:**
- `emergency` - Экстренная ситуация
- `suspicious` - Подозрительная активность
- `maintenance` - Техническое обслуживание
- `manual` - Ручная заморозка

### 5. Security Events

Все события безопасности логируются:
- `rate_limit_exceeded` - Превышение лимита
- `suspicious_bet` - Подозрительная ставка
- `multi_account` - Множественные аккаунты
- `market_freeze` - Заморозка рынка
- `market_unfreeze` - Разморозка рынка

## API Endpoints

### GET /security/events
Получение событий безопасности

**Query Parameters:**
- `eventType` - Тип события
- `severity` - Серьезность (low, medium, high, critical)
- `isResolved` - Решено ли событие
- `page` - Номер страницы
- `limit` - Количество на странице

### GET /security/suspicious-activities
Получение подозрительной активности

**Query Parameters:**
- `userId` - ID пользователя
- `isReviewed` - Просмотрено ли
- `page` - Номер страницы
- `limit` - Количество на странице

### GET /security/multi-account-clusters
Получение кластеров множественных аккаунтов

**Query Parameters:**
- `isConfirmed` - Подтвержден ли кластер
- `page` - Номер страницы
- `limit` - Количество на странице

### POST /security/markets/:marketId/freeze
Заморозка рынка

**Request:**
```json
{
  "reason": "Подозрительная активность",
  "freezeType": "suspicious",
  "severity": "high",
  "metadata": {}
}
```

### POST /security/markets/freeze-all
Экстренная заморозка всех рынков

**Request:**
```json
{
  "reason": "Критическая ситуация"
}
```

### POST /security/markets/:marketId/unfreeze
Разморозка рынка

**Request:**
```json
{
  "unfreezeReason": "Проблема решена"
}
```

### GET /security/market-freezes
Получение активных заморозок

**Query Parameters:**
- `marketId` - ID рынка (опционально)

### POST /security/analyze-user/:userId
Анализ пользователя на множественные аккаунты

**Request:**
```json
{
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "fingerprint": "browser-fingerprint"
}
```

### POST /security/analyze-bet/:betId
Анализ ставки на подозрительность

## Интеграция

### В Bets Service

Автоматически проверяется:
- Заморозка рынка перед размещением ставки
- Анализ подозрительности после создания ставки

### Risk Score

Каждый пользователь имеет `riskScore` (0-100):
- Обновляется при обнаружении подозрительной активности
- Влияет на rate limiting
- Используется для принятия решений

## Мониторинг

В админ-панели доступна страница `/security` с:
- Событиями безопасности
- Подозрительной активностью
- Кластерами множественных аккаунтов
- Активными заморозками рынков

## Настройка

В `.env` можно настроить:
```env
# Rate limiting
RATE_LIMIT_TTL=60000 # 1 minute
RATE_LIMIT_MAX=100 # requests per minute

# Multi-account detection
MULTI_ACCOUNT_MIN_CONFIDENCE=50 # minimum confidence %

# Suspicious betting
SUSPICIOUS_BET_RISK_THRESHOLD=70 # risk score threshold
```

## Автоматические задачи

- **Multi-account detection**: Каждые 6 часов
- **Risk score decay**: Постепенное снижение risk score со временем (можно добавить)

## Безопасность

- Все действия логируются с IP и User Agent
- Критические события требуют подтверждения администратора
- Экстренная заморозка доступна только администраторам
- Все события безопасности сохраняются для аудита

