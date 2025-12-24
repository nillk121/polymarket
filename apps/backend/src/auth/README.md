# Auth Module - Telegram Authentication

Модуль аутентификации через Telegram WebApp с JWT токенами и RBAC.

## Возможности

- ✅ Валидация Telegram WebApp initData (hash проверка)
- ✅ Создание/обновление пользователя при логине
- ✅ JWT access и refresh токены
- ✅ Роли и разрешения в JWT payload
- ✅ Guards для защиты API
- ✅ Декораторы для удобного использования

## Использование

### 1. Авторизация через Telegram

```typescript
POST /api/auth/telegram
Content-Type: application/json

{
  "id": "123456789",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "auth_date": 1234567890,
  "hash": "abc123..."
}

Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "telegramId": "123456789",
    "username": "johndoe",
    "roles": ["user"],
    "permissions": ["market:view"]
  }
}
```

### 2. Обновление access token

```typescript
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGc..."
}

Response:
{
  "access_token": "eyJhbGc..."
}
```

### 3. Получение текущего пользователя

```typescript
GET /api/auth/me
Authorization: Bearer <access_token>

Response:
{
  "id": "uuid",
  "telegramId": "123456789",
  "username": "johndoe",
  "roles": ["user"],
  "permissions": ["market:view"]
}
```

## Guards

### JwtAuthGuard
Требует валидный JWT токен:

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute() {}
```

### RolesGuard
Требует определенную роль:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin-only')
async adminRoute() {}
```

### PermissionsGuard
Требует определенное разрешение:

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('market:create')
@Post('markets')
async createMarket() {}
```

## Декораторы

### @CurrentUser()
Получить текущего пользователя из request:

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: any) {
  return user;
}
```

### @Public()
Пометить endpoint как публичный (без аутентификации):

```typescript
@Get('public')
@Public()
async publicRoute() {}
```

### @Roles()
Требовать определенные роли:

```typescript
@Roles('admin', 'moderator')
```

### @Permissions()
Требовать определенные разрешения:

```typescript
@Permissions('market:create', 'market:edit')
```

## Примеры использования

См. `src/examples/protected.controller.ts` для полных примеров.

## Валидация Telegram Hash

Алгоритм валидации соответствует официальной документации Telegram:
https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

1. Извлекаем все поля кроме `hash`
2. Сортируем по ключам
3. Создаем `data-check-string`
4. Вычисляем secret key через HMAC-SHA256
5. Вычисляем hash через HMAC-SHA256
6. Сравниваем с полученным hash

## Безопасность

- ✅ Проверка hash от Telegram
- ✅ Проверка времени (auth_date не старше 24 часов)
- ✅ JWT токены с expiration
- ✅ Разделение access и refresh токенов
- ✅ Проверка активности пользователя
- ✅ Проверка бана пользователя
- ✅ Rate limiting через Throttler

## Конфигурация

В `.env`:
```
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=your-bot-token
```

