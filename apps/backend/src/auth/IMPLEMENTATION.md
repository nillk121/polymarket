# Telegram Authentication - Полная реализация

## ✅ Реализовано

### 1. Валидация Telegram WebApp initData
- ✅ Проверка hash через HMAC-SHA256
- ✅ Проверка времени (auth_date не старше 24 часов)
- ✅ Поддержка development режима (пропуск проверки без токена)

### 2. Создание/обновление пользователя
- ✅ Автоматическое создание пользователя при первом входе
- ✅ Обновление данных пользователя при повторном входе
- ✅ Автоматическое назначение роли "user" новым пользователям

### 3. JWT токены
- ✅ Access token (15 минут)
- ✅ Refresh token (7 дней)
- ✅ Роли и разрешения в payload
- ✅ Обновление access token через refresh token

### 4. Guards
- ✅ `JwtAuthGuard` - Проверка JWT токена
- ✅ `RolesGuard` - Проверка ролей
- ✅ `PermissionsGuard` - Проверка разрешений
- ✅ `PublicGuard` - Публичные endpoints

### 5. Декораторы
- ✅ `@CurrentUser()` - Получение текущего пользователя
- ✅ `@Public()` - Публичный endpoint
- ✅ `@Roles()` - Требование ролей
- ✅ `@Permissions()` - Требование разрешений

### 6. DTOs
- ✅ `TelegramAuthDto` - Валидация данных от Telegram
- ✅ `RefreshTokenDto` - Валидация refresh token
- ✅ `LoginResponseDto` - Ответ при логине

### 7. Примеры
- ✅ Пример контроллера с различными уровнями защиты
- ✅ Документация по использованию
- ✅ Примеры для фронтенда

## Структура файлов

```
apps/backend/src/auth/
├── auth.controller.ts          # Контроллер аутентификации
├── auth.service.ts              # Сервис аутентификации
├── auth.module.ts               # Модуль аутентификации
├── dto/
│   ├── telegram-auth.dto.ts     # DTO для Telegram авторизации
│   ├── refresh-token.dto.ts     # DTO для refresh token
│   └── login-response.dto.ts    # DTO ответа при логине
├── guards/
│   ├── jwt-auth.guard.ts        # Guard для JWT
│   ├── roles.guard.ts           # Guard для ролей
│   ├── permissions.guard.ts     # Guard для разрешений
│   └── public.guard.ts          # Guard для публичных endpoints
├── decorators/
│   ├── current-user.decorator.ts # Декоратор текущего пользователя
│   ├── roles.decorator.ts        # Декоратор ролей
│   ├── permissions.decorator.ts  # Декоратор разрешений
│   └── public.decorator.ts       # Декоратор публичного endpoint
├── strategies/
│   └── jwt.strategy.ts          # JWT стратегия Passport
├── interceptors/
│   ├── roles-permissions.interceptor.ts # Интерцептор для добавления ролей/разрешений
│   └── logging.interceptor.ts   # Интерцептор для логирования
├── utils/
│   └── telegram-validator.ts    # Утилиты для валидации Telegram
├── README.md                    # Документация
├── TELEGRAM_AUTH.md            # Подробная документация
└── examples.md                  # Примеры использования
```

## API Endpoints

### POST /api/auth/telegram
Авторизация через Telegram WebApp

**Request:**
```json
{
  "id": "123456789",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "auth_date": 1234567890,
  "hash": "abc123..."
}
```

**Response:**
```json
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

### POST /api/auth/refresh
Обновление access token

**Request:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc..."
}
```

### GET /api/auth/me
Получение текущего пользователя

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "telegramId": "123456789",
  "username": "johndoe",
  "roles": ["user"],
  "permissions": ["market:view"]
}
```

### POST /api/auth/logout
Выход пользователя

**Headers:**
```
Authorization: Bearer <access_token>
```

## Использование в контроллерах

### Публичный endpoint
```typescript
@Get('public')
@Public()
async publicEndpoint() {
  return { message: 'Доступно всем' };
}
```

### Защищенный endpoint
```typescript
@Get('protected')
@UseGuards(JwtAuthGuard)
async protectedEndpoint(@CurrentUser() user: any) {
  return { user };
}
```

### Endpoint только для админов
```typescript
@Post('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async adminEndpoint(@CurrentUser() user: any) {
  return { message: 'Только для админов' };
}
```

### Endpoint с проверкой разрешения
```typescript
@Post('markets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('market:create')
async createMarket(@Body() data: any, @CurrentUser() user: any) {
  return this.marketsService.create(data, user.id);
}
```

## Конфигурация

В `.env`:
```
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=your-bot-token
NODE_ENV=development
```

## Безопасность

1. ✅ Валидация hash от Telegram
2. ✅ Проверка времени (защита от replay атак)
3. ✅ JWT токены с expiration
4. ✅ Разделение access и refresh токенов
5. ✅ Проверка активности пользователя
6. ✅ Проверка бана пользователя
7. ✅ RBAC (роли и разрешения)
8. ✅ Rate limiting

## Тестирование

### Локальная разработка
В development режиме проверка hash может быть отключена, если `TELEGRAM_BOT_TOKEN` не установлен.

### Production
Обязательно установите `TELEGRAM_BOT_TOKEN` для валидации hash.

## Примеры

См. `src/examples/protected.controller.ts` для полных примеров использования.

