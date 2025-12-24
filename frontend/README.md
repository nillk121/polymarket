# Frontend

React приложение для Telegram Mini App.

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env`:

```bash
VITE_API_URL=http://localhost:3000
```

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
```

## Структура

- `src/pages/` - Страницы приложения
- `src/components/` - Переиспользуемые компоненты
- `src/api/` - API клиенты
- `src/store/` - Zustand stores
- `src/hooks/` - React hooks

## Интеграция с Telegram

Приложение использует Telegram WebApp SDK для интеграции с Telegram Mini App.

