# Payments Module

Единый модуль для обработки платежей через различные провайдеры.

## Поддерживаемые провайдеры

- ✅ **TON Wallet** (TON Connect)
- ✅ **Telegram Wallet**
- ✅ **Telegram Stars**

## Возможности

- ✅ Единый интерфейс для всех провайдеров
- ✅ Верификация webhook
- ✅ Идемпотентность операций
- ✅ Защита от replay атак
- ✅ Автоматическое зачисление средств

## Архитектура

### PaymentProvider Interface

Все провайдеры реализуют единый интерфейс `IPaymentProvider`:

```typescript
interface IPaymentProvider {
  type: PaymentProviderType;
  createPayment(params): Promise<CreatePaymentResult>;
  checkPaymentStatus(paymentId): Promise<PaymentStatus>;
  verifyWebhook(params): Promise<boolean>;
  parseWebhook(payload): Promise<WebhookData>;
  cancelPayment(paymentId): Promise<boolean>;
  refundPayment(paymentId, amount?): Promise<boolean>;
}
```

### PaymentGatewayService

Единый сервис для работы со всеми провайдерами:

- Автоматический выбор провайдера
- Обработка webhook
- Идемпотентность
- Защита от replay атак
- Автоматическое зачисление средств

## API Endpoints

### POST /payments
Создание платежа

**Request:**
```json
{
  "provider": "ton_wallet",
  "walletId": "wallet-uuid",
  "amount": 100,
  "currency": "TON",
  "description": "Deposit",
  "idempotencyKey": "optional-key"
}
```

**Response:**
```json
{
  "paymentId": "payment-uuid",
  "providerPaymentId": "ton_1234567890_uuid",
  "status": "pending",
  "deepLink": "ton://transfer/...",
  "qrCode": "https://chart.googleapis.com/...",
  "expiresAt": "2024-01-01T00:15:00Z",
  "transactionId": "transaction-uuid"
}
```

### POST /payments/webhooks/ton
Webhook для TON Wallet

**Headers:**
- `x-signature` - Подпись webhook
- `x-timestamp` - Временная метка

### POST /payments/webhooks/telegram-wallet
Webhook для Telegram Wallet

**Headers:**
- `x-signature` - Подпись webhook

### POST /payments/webhooks/telegram-stars
Webhook для Telegram Stars

**Headers:**
- `x-signature` - Подпись webhook

### GET /payments/:id/status
Проверка статуса платежа

### GET /payments/transactions
Получение транзакций пользователя

## Идемпотентность

Все операции поддерживают идемпотентность через `idempotencyKey`:

```typescript
// Первый запрос
POST /payments
{
  "provider": "ton_wallet",
  "amount": 100,
  "idempotencyKey": "unique-key-123"
}

// Повторный запрос с тем же ключом вернет тот же результат
POST /payments
{
  "provider": "ton_wallet",
  "amount": 100,
  "idempotencyKey": "unique-key-123"
}
```

## Защита от Replay атак

1. **Верификация webhook подписи**
   - HMAC-SHA256 для всех провайдеров
   - Проверка временной метки (если поддерживается)

2. **Проверка дублирующих webhook**
   - Хранение обработанных webhook
   - Игнорирование повторных запросов

3. **Идемпотентные ключи**
   - Автоматическая генерация или ручное указание
   - Хранение результатов операций

## Верификация Webhook

### TON Wallet

```typescript
// Подпись: HMAC-SHA256(payload, webhook_secret)
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');
```

### Telegram Wallet / Stars

```typescript
// Подпись: HMAC-SHA256(payload, webhook_secret)
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Конфигурация

В `.env`:

```env
# TON
TON_API_URL=https://tonapi.io
TON_API_KEY=your-api-key
TON_WEBHOOK_SECRET=your-webhook-secret

# Telegram Wallet
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WALLET_WEBHOOK_SECRET=your-webhook-secret
TELEGRAM_WALLET_PROVIDER_TOKEN=your-provider-token

# Telegram Stars
TELEGRAM_STARS_WEBHOOK_SECRET=your-webhook-secret
```

## Примеры использования

### Создание платежа через TON Wallet

```typescript
POST /payments
Authorization: Bearer <token>

{
  "provider": "ton_wallet",
  "walletId": "wallet-uuid",
  "amount": 10,
  "currency": "TON",
  "description": "Deposit 10 TON"
}

Response:
{
  "paymentId": "payment-uuid",
  "deepLink": "ton://transfer/...",
  "qrCode": "https://..."
}
```

### Создание платежа через Telegram Stars

```typescript
POST /payments
Authorization: Bearer <token>

{
  "provider": "telegram_stars",
  "walletId": "wallet-uuid",
  "amount": 100,
  "currency": "XTR",
  "description": "Deposit 100 Stars"
}
```

### Обработка webhook (автоматически)

```typescript
// Webhook автоматически:
// 1. Верифицирует подпись
// 2. Парсит данные
// 3. Находит транзакцию
// 4. Обновляет статус
// 5. Зачисляет средства на баланс
```

## Поток платежа

1. **Создание платежа**
   - Пользователь создает платеж через API
   - Генерируется payment ID и provider payment ID
   - Создается транзакция со статусом `pending`
   - Возвращается deep link / QR код

2. **Ожидание платежа**
   - Пользователь оплачивает через провайдера
   - Провайдер отправляет webhook

3. **Обработка webhook**
   - Верификация подписи
   - Парсинг данных
   - Обновление транзакции
   - Зачисление средств на баланс

4. **Завершение**
   - Транзакция получает статус `completed`
   - Средства доступны на балансе

## Безопасность

1. ✅ Верификация webhook подписи
2. ✅ Проверка временных меток
3. ✅ Идемпотентность операций
4. ✅ Защита от replay атак
5. ✅ Валидация данных
6. ✅ Проверка прав доступа


