# Web Dashboard

Next.js 14 админ панель и аналитика.

## Запуск

```bash
# Из корня монорепозитория
npm run dev:web-dashboard

# Или из директории приложения
cd apps/web-dashboard
npm run dev
```

## Зависимости

Использует shared packages:
- `@polymarket/shared-types` - общие типы
- `@polymarket/shared-utils` - утилиты
- `@polymarket/analytics-sdk` - аналитика

## Конфигурация

Создайте `.env.local` файл:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

