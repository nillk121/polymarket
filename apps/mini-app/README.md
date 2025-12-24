# Telegram Mini App

React + Vite приложение для Telegram Mini App платформы прогнозных рынков.

## Технологии

- **React 18** - UI библиотека
- **Vite** - Сборщик
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **Zustand** - Управление состоянием
- **React Query** - Управление серверным состоянием
- **Telegram WebApp SDK** - Интеграция с Telegram

## Установка

```bash
npm install
```

## Настройка

1. Создайте файл `.env`:
```bash
cp .env.example .env
```

2. Настройте `VITE_API_URL`:
```
VITE_API_URL=http://localhost:3000/api
```

## Запуск

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## Структура

```
src/
├── api/              # API клиенты
├── components/       # React компоненты
│   └── layout/      # Layout компоненты
├── screens/         # Экраны приложения
├── store/           # Zustand stores
├── lib/             # Утилиты
└── main.tsx         # Точка входа
```

## Экраны

- **Markets List** - Список активных рынков
- **Market Detail** - Детали рынка с исходами
- **Place Bet** - Размещение ставки
- **Wallet** - Баланс и транзакции
- **Profile** - Профиль пользователя

## Интеграция с Telegram

Приложение автоматически:
- Инициализирует Telegram WebApp SDK
- Авторизует пользователя через Telegram initData
- Использует Telegram UI компоненты
- Адаптируется под размеры экрана Telegram

## API

Все API запросы идут через настроенный axios клиент с автоматической авторизацией.

## Mobile-First Design

Все экраны оптимизированы для мобильных устройств с использованием Tailwind CSS.
