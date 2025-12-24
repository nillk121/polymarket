# Quick Start Guide

## Быстрый старт NestJS Backend

### 1. Установка

```bash
cd apps/backend
npm install
```

### 2. Настройка окружения

Создайте `.env` файл:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket?schema=public
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Инициализация базы данных

```bash
# Генерация Prisma Client
npm run prisma:generate

# Применение миграций
npm run prisma:migrate

# Заполнение начальных данных
npm run prisma:seed
```

### 4. Запуск Redis (если не запущен)

```bash
# Docker
docker run -d -p 6379:6379 redis:alpine

# Или локально
redis-server
```

### 5. Запуск сервера

```bash
npm run dev
```

Сервер будет доступен на `http://localhost:3000/api`

## Проверка работы

```bash
# Health check
curl http://localhost:3000/api/health

# Должен вернуть:
# {"status":"ok","timestamp":"...","database":"connected"}
```

## Структура

```
apps/backend/
├── prisma/
│   ├── schema.prisma      # Prisma схема
│   └── seed.ts            # Начальные данные
├── src/
│   ├── main.ts            # Точка входа
│   ├── app.module.ts      # Главный модуль
│   ├── prisma/            # Prisma сервис
│   ├── auth/              # Аутентификация и RBAC
│   ├── users/             # Пользователи
│   ├── categories/        # Категории
│   ├── markets/           # Рынки
│   ├── bets/              # Ставки
│   ├── payments/          # Платежи
│   ├── payouts/           # Выплаты
│   ├── analytics/         # Аналитика
│   └── admin/             # Админ панель
└── .env                   # Переменные окружения
```

## Основные команды

```bash
npm run dev              # Запуск в режиме разработки
npm run build            # Сборка
npm run start:prod       # Запуск production
npm run prisma:studio    # Открыть Prisma Studio
npm run lint             # Линтинг
npm run test             # Тесты
```

