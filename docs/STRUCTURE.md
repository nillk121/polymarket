# Структура монорепозитория

## Полная структура проекта

```
polymarket/
├── apps/                          # Приложения
│   ├── backend/                   # NestJS API
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── mini-app/                  # Telegram Mini App (React + Vite)
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── README.md
│   ├── web-dashboard/             # Admin Dashboard (Next.js 14)
│   │   ├── src/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── README.md
│   └── telegram-bot/               # Telegram Bot (Grammy)
│       ├── src/
│       ├── package.json
│       └── README.md
│
├── packages/                      # Shared packages
│   ├── shared-types/              # Общие TypeScript типы
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared-utils/              # Общие утилиты
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── pricing-engine/            # AMM логика ценообразования
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── analytics-sdk/             # SDK для аналитики
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── contracts/                     # Smart contracts
│   └── ton/                       # TON Smart Contracts
│       ├── market.fc
│       └── README.md
│
├── infra/                         # Инфраструктура
│   ├── docker/                    # Docker конфигурации
│   │   ├── docker-compose.yml
│   │   ├── backend.Dockerfile
│   │   └── mini-app.Dockerfile
│   ├── nginx/                     # Nginx конфигурации
│   │   ├── nginx.conf
│   │   └── mini-app.conf
│   └── ci/                        # CI/CD
│       └── github-actions.yml
│
├── .github/                       # GitHub конфигурации
│   └── workflows/
│       └── ci.yml
│
├── package.json                   # Root package.json
├── turbo.json                     # Turborepo конфигурация
├── .prettierrc                    # Prettier конфигурация
├── .gitignore                     # Git ignore
├── README.md                      # Основной README
├── MONOREPO.md                    # Документация монорепозитория
├── MIGRATION.md                   # Руководство по миграции
└── STRUCTURE.md                   # Этот файл
```

## Решения по инструментам

### Монорепозиторий: Turborepo
**Почему Turborepo:**
- ✅ Проще в настройке чем Nx
- ✅ Отличная поддержка npm workspaces
- ✅ Быстрый кэш сборки
- ✅ Минимальная конфигурация
- ✅ Хорошая интеграция с существующим кодом

### Package Manager: npm workspaces
**Почему npm workspaces:**
- ✅ Встроен в npm (не нужны дополнительные инструменты)
- ✅ Простая настройка
- ✅ Хорошая поддержка в Turborepo
- ✅ Достаточно для наших нужд

### Backend: NestJS
- Модульная архитектура
- TypeScript из коробки
- Отличная экосистема
- Уже используется в проекте

### Mini App: React + Vite
- Быстрая разработка
- Отличная поддержка TypeScript
- Малый размер бандла
- Уже используется в проекте

### Web Dashboard: Next.js 14
- React Server Components
- Отличный DX
- Встроенная оптимизация
- SEO-friendly

### Telegram Bot: Grammy
- TypeScript-first
- Современный API
- Хорошая документация
- Легковесный

## Зависимости между пакетами

```
apps/backend
  ├── @polymarket/shared-types
  ├── @polymarket/shared-utils
  ├── @polymarket/pricing-engine
  └── @polymarket/analytics-sdk

apps/mini-app
  ├── @polymarket/shared-types
  ├── @polymarket/shared-utils
  └── @polymarket/analytics-sdk

apps/web-dashboard
  ├── @polymarket/shared-types
  ├── @polymarket/shared-utils
  └── @polymarket/analytics-sdk

apps/telegram-bot
  ├── @polymarket/shared-types
  └── @polymarket/shared-utils

packages/pricing-engine
  └── @polymarket/shared-types

packages/analytics-sdk
  └── @polymarket/shared-types
```

## Порты приложений

- **backend**: 3000
- **mini-app**: 5173 (dev), 80 (prod)
- **web-dashboard**: 3001 (dev), 3000 (prod)
- **telegram-bot**: нет порта (polling/webhook)

## Команды

### Разработка
```bash
npm run dev                    # Все приложения
npm run dev:backend           # Только backend
npm run dev:mini-app         # Только mini-app
npm run dev:web-dashboard    # Только web-dashboard
npm run dev:telegram-bot     # Только telegram-bot
```

### Сборка
```bash
npm run build                 # Все приложения
```

### Линтинг и проверка
```bash
npm run lint                  # Линтинг
npm run type-check           # Проверка типов
npm run format                # Форматирование
```

## Следующие шаги

1. ✅ Создана структура монорепозитория
2. ✅ Настроен Turborepo
3. ✅ Созданы shared packages
4. ✅ Настроена инфраструктура
5. ⏳ Переместить существующий код (см. MIGRATION.md)
6. ⏳ Обновить импорты для использования shared packages
7. ⏳ Настроить CI/CD
8. ⏳ Протестировать сборку и запуск

