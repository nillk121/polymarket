# Быстрое исправление ошибки установки

## Проблема
```
npm error notarget No matching version found for passport-telegram@^0.0.2
```

## Решение

Пакет `passport-telegram` не существует в npm. Он был удален из зависимостей.

### Что было исправлено:

1. ✅ Удален `passport-telegram` из `backend/package.json`
2. ✅ Обновлена `TelegramStrategy` - теперь не использует несуществующий пакет
3. ✅ Упрощена стратегия аутентификации Telegram

### Установка зависимостей

Теперь можно установить зависимости:

```bash
# Для старой структуры (backend/)
cd backend
npm install

# Или для монорепозитория
npm install
```

### Примечание

Telegram WebApp аутентификация теперь происходит через прямую валидацию hash в `AuthService`, а не через passport стратегию. Это более правильный подход для Telegram Mini Apps.

Для production нужно добавить проверку hash:
```typescript
import * as crypto from 'crypto';

const secretKey = crypto
  .createHmac('sha256', 'WebAppData')
  .update(process.env.TELEGRAM_BOT_TOKEN)
  .digest();
  
const calculatedHash = crypto
  .createHmac('sha256', secretKey)
  .update(dataCheckString)
  .digest('hex');
```

