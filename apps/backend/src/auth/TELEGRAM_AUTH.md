# Telegram Authentication - Полная реализация

## Обзор

Полная реализация аутентификации через Telegram WebApp с валидацией initData, JWT токенами и RBAC.

## Компоненты

### 1. AuthService
- `validateTelegramUser()` - Валидация и создание/обновление пользователя
- `validateTelegramHash()` - Проверка hash от Telegram
- `login()` - Выдача access и refresh токенов
- `refreshToken()` - Обновление access token
- `validateUser()` - Валидация пользователя по ID
- `extractPermissions()` - Извлечение разрешений из ролей

### 2. Guards
- `JwtAuthGuard` - Проверка JWT токена
- `RolesGuard` - Проверка ролей
- `PermissionsGuard` - Проверка разрешений
- `PublicGuard` - Пропуск аутентификации для публичных endpoints

### 3. Decorators
- `@CurrentUser()` - Получение текущего пользователя
- `@Public()` - Публичный endpoint
- `@Roles()` - Требование ролей
- `@Permissions()` - Требование разрешений

### 4. DTOs
- `TelegramAuthDto` - Валидация данных от Telegram
- `RefreshTokenDto` - Валидация refresh token
- `LoginResponseDto` - Ответ при логине

## Валидация Telegram WebApp

### Алгоритм

1. Получаем `initData` от Telegram WebApp
2. Парсим параметры (user, auth_date, hash, и т.д.)
3. Создаем `data-check-string` из всех параметров кроме `hash`
4. Вычисляем secret key: `HMAC-SHA256('WebAppData', botToken)`
5. Вычисляем hash: `HMAC-SHA256(secretKey, data-check-string)`
6. Сравниваем с полученным hash

### Проверки

- ✅ Hash валиден
- ✅ auth_date не старше 24 часов
- ✅ Пользователь активен
- ✅ Пользователь не забанен

## JWT Токены

### Access Token
- Содержит: user id, telegram id, roles, permissions
- Expires: 15 минут (настраивается)
- Используется: для доступа к API

### Refresh Token
- Содержит: user id, telegram id
- Expires: 7 дней (настраивается)
- Используется: для обновления access token

## Использование

### Пример контроллера

```typescript
@Controller('markets')
export class MarketsController {
  // Публичный endpoint
  @Get()
  @Public()
  async findAll() {
    return this.marketsService.findAll();
  }

  // Требует аутентификации
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyMarkets(@CurrentUser() user: any) {
    return this.marketsService.findByUser(user.id);
  }

  // Требует роль admin
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() data: any) {
    return this.marketsService.create(data);
  }

  // Требует разрешение
  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('market:resolve')
  async resolve(@Param('id') id: string) {
    return this.marketsService.resolve(id);
  }
}
```

## Безопасность

1. **Валидация hash** - Защита от подделки данных
2. **Проверка времени** - Защита от replay атак
3. **JWT expiration** - Ограниченное время жизни токенов
4. **Refresh tokens** - Безопасное обновление токенов
5. **RBAC** - Контроль доступа на уровне ролей и разрешений
6. **Rate limiting** - Защита от брутфорса

## Тестирование

### Локальная разработка

В development режиме проверка hash может быть отключена, если `TELEGRAM_BOT_TOKEN` не установлен.

### Production

Обязательно установите `TELEGRAM_BOT_TOKEN` для валидации hash.

