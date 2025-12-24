# Polymarket Telegram - Монорепозиторий

Платформа прогнозных рынков в стиле Polymarket для Telegram.

## Архитектура

- **Backend**: NestJS (TypeScript)
- **Mini App**: React + Vite (Telegram Mini App)
- **Web Dashboard**: Next.js 14 (Admin + Analytics)
- **Telegram Bot**: Grammy (TypeScript)
- **Платежи**: TON Wallet, Telegram Wallet, Telegram Stars
- **Механизм ценообразования**: AMM (LMSR и Constant Product)
- **Язык интерфейса**: Русский

## Структура проекта

```
polymarket/
├── apps/
│   ├── backend/          # NestJS API
│   ├── mini-app/         # Telegram Mini App (React + Vite)
│   ├── web-dashboard/    # Admin Dashboard (Next.js 14)
│   └── telegram-bot/     # Telegram Bot (Grammy)
├── packages/
│   ├── shared-types/      # Общие типы TypeScript
│   ├── shared-utils/      # Общие утилиты
│   ├── pricing-engine/   # AMM логика ценообразования
│   └── analytics-sdk/    # SDK для аналитики
├── contracts/
│   └── ton/              # TON Smart Contracts (FunC)
├── infra/
│   ├── docker/           # Docker конфигурации
│   ├── nginx/            # Nginx конфигурации
│   └── ci/               # CI/CD конфигурации
└── README.md
```

## Технологии

- **Monorepo**: Turborepo
- **Package Manager**: npm workspaces
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Frontend**: React, Vite, Zustand
- **Dashboard**: Next.js 14, React Server Components
- **Bot**: Grammy (Telegram Bot Framework)
- **Smart Contracts**: FunC (TON)

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Создайте `.env` файлы (шаблоны уже созданы, нужно только заполнить значения):

- `apps/backend/.env` - настройте `DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`
- `apps/mini-app/.env` - уже настроен
- `apps/telegram-bot/.env` - настройте `TELEGRAM_BOT_TOKEN`
- `apps/web-dashboard/.env` - уже настроен

**Подробнее:** [docs/ENV_SETUP.md](docs/ENV_SETUP.md)

### 3. Настройка базы данных

```bash
cd apps/backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Запуск

```bash
# Запуск всех приложений
npm run dev

# Или отдельно:
npm run dev:backend      # http://localhost:3000/api
npm run dev:mini-app     # http://localhost:5173
npm run dev:web-dashboard # http://localhost:3001
npm run dev:telegram-bot
```

**Подробная инструкция:** [docs/QUICK_START.md](docs/QUICK_START.md)

---

## Установка (детально)

```bash
npm install
```

## Разработка

### Запуск всех приложений
```bash
npm run dev
```

### Запуск отдельных приложений
```bash
npm run dev:backend
npm run dev:mini-app
npm run dev:web-dashboard
npm run dev:telegram-bot
```

## Сборка

```bash
npm run build
```

## Линтинг и форматирование

```bash
npm run lint
npm run format
```

## Структура пакетов

### packages/shared-types
Общие TypeScript типы и интерфейсы для всех приложений.

### packages/shared-utils
Переиспользуемые утилиты и хелперы.

### packages/pricing-engine
Логика AMM ценообразования (LMSR, Constant Product).

### packages/analytics-sdk
SDK для работы с аналитикой и трекингом событий.

## Инфраструктура

### Docker
Docker Compose конфигурации для локальной разработки и production.

### Nginx
Конфигурации reverse proxy для production.

### CI/CD
GitHub Actions workflows для автоматизации деплоя.

## Конфигурация

Создайте файлы `.env` в соответствующих директориях приложений.

📖 **Подробные инструкции по настройке:** [docs/ENV_SETUP.md](./docs/ENV_SETUP.md)

В файле `docs/ENV_SETUP.md` вы найдете:
- Подробное описание всех переменных окружения
- Инструкции по получению токенов и ключей
- Примеры конфигураций для разных окружений
- Troubleshooting и решение проблем
- Рекомендации по безопасности

## 📚 Документация

Вся документация проекта находится в папке [`docs/`](./docs/):

- [Общая документация](./docs/README.md) - Полный список документации
- [Структура проекта](./docs/STRUCTURE.md) - Детальная структура
- [Настройка окружения](./docs/ENV_SETUP.md) - Переменные окружения
- [Аудит проекта](./docs/AUDIT_REPORT.md) - Отчет аудита
- [Рефакторинг](./docs/REFACTORING_COMPLETED.md) - Выполненные улучшения
