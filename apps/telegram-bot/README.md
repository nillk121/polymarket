# Telegram Bot

Telegram бот на Grammy для уведомлений и команд.

## Запуск

```bash
# Из корня монорепозитория
npm run dev:telegram-bot

# Или из директории приложения
cd apps/telegram-bot
npm run dev
```

## Зависимости

Использует shared packages:
- `@polymarket/shared-types` - общие типы
- `@polymarket/shared-utils` - утилиты

## Конфигурация

Создайте `.env` файл:
```
TELEGRAM_BOT_TOKEN=your-bot-token
API_URL=http://localhost:3000
```

