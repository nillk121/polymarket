# Монорепозиторий - Структура и решения

## Выбор инструмента: Turborepo

Выбран **Turborepo** вместо Nx по следующим причинам:
- Проще в настройке и использовании
- Меньше конфигурации из коробки
- Отличная поддержка npm workspaces
- Быстрый кэш сборки
- Хорошая интеграция с существующим кодом

## Структура проекта

```
polymarket/
├── apps/
│   ├── backend/          # NestJS API (порт 3000)
│   ├── mini-app/         # Telegram Mini App (React + Vite)
│   ├── web-dashboard/    # Admin Dashboard (Next.js 14, порт 3001)
│   └── telegram-bot/     # Telegram Bot (Grammy)
├── packages/
│   ├── shared-types/     # Общие TypeScript типы
│   ├── shared-utils/     # Общие утилиты
│   ├── pricing-engine/   # AMM логика ценообразования
│   └── analytics-sdk/    # SDK для аналитики
├── contracts/
│   └── ton/              # TON Smart Contracts (FunC)
├── infra/
│   ├── docker/           # Docker конфигурации
│   ├── nginx/            # Nginx конфигурации
│   └── ci/               # CI/CD конфигурации
└── [root config files]
```

## Приложения (apps/)

### backend
- **Технологии**: NestJS, TypeORM, PostgreSQL
- **Порт**: 3000
- **Зависимости**: Использует все shared packages
- **Назначение**: REST API для всех клиентов

### mini-app
- **Технологии**: React, Vite, Zustand
- **Порт**: 5173 (dev), 80 (prod)
- **Зависимости**: shared-types, shared-utils, analytics-sdk
- **Назначение**: Telegram Mini App для пользователей

### web-dashboard
- **Технологии**: Next.js 14, React Server Components
- **Порт**: 3001 (dev), 3000 (prod)
- **Зависимости**: shared-types, shared-utils, analytics-sdk
- **Назначение**: Админ-панель и аналитика

### telegram-bot
- **Технологии**: Grammy (TypeScript)
- **Зависимости**: shared-types, shared-utils
- **Назначение**: Telegram бот для уведомлений и команд

## Пакеты (packages/)

### shared-types
- Общие TypeScript типы и интерфейсы
- Используется всеми приложениями
- Обеспечивает типобезопасность между приложениями

### shared-utils
- Переиспользуемые утилиты
- Форматирование, валидация, хелперы
- Зависит от: decimal.js

### pricing-engine
- Логика AMM ценообразования
- LMSR и Constant Product модели
- Зависит от: shared-types, decimal.js

### analytics-sdk
- SDK для работы с аналитикой
- Трекинг событий
- Зависит от: shared-types

## Контракты (contracts/)

### ton/
- TON Smart Contracts на FunC
- Контракты для рынков, платежей, ликвидности
- Компиляция через `func` и `fift`

## Инфраструктура (infra/)

### docker/
- Docker Compose для локальной разработки
- Dockerfile для каждого приложения
- Production-ready конфигурации

### nginx/
- Reverse proxy конфигурации
- SSL/TLS настройки
- Маршрутизация между сервисами

### ci/
- GitHub Actions workflows
- Автоматизация сборки и деплоя
- Тестирование и линтинг

## Команды

### Разработка
```bash
npm run dev                    # Запуск всех приложений
npm run dev:backend           # Только backend
npm run dev:mini-app          # Только mini-app
npm run dev:web-dashboard     # Только web-dashboard
npm run dev:telegram-bot      # Только telegram-bot
```

### Сборка
```bash
npm run build                 # Сборка всех приложений
npm run build:all            # То же самое
```

### Линтинг и форматирование
```bash
npm run lint                  # Линтинг всех проектов
npm run format                # Форматирование кода
npm run type-check            # Проверка типов
```

## Преимущества монорепозитория

1. **Единая кодовая база**: Все проекты в одном репозитории
2. **Переиспользование кода**: Shared packages для общей логики
3. **Типобезопасность**: Общие типы между приложениями
4. **Упрощенный CI/CD**: Одна конфигурация для всех проектов
5. **Быстрая сборка**: Turborepo кэширует результаты
6. **Атомарные коммиты**: Изменения в нескольких проектах в одном коммите

## Миграция существующего кода

1. ✅ **Backend**: Переместить `backend/` → `apps/backend/` - выполнено
2. ✅ **Frontend**: Переместить `frontend/` → `apps/mini-app/` - выполнено
3. ✅ **Обновить импорты**: Использовать shared packages - выполнено
4. ✅ **Обновить конфигурации**: Адаптировать под монорепозиторий - выполнено
5. ✅ **Удалить старые папки**: `backend/` и `frontend/` - выполнено

## Следующие шаги

1. Переместить существующий код в новую структуру
2. Обновить импорты для использования shared packages
3. Настроить CI/CD pipeline
4. Настроить Docker для production
5. Документировать процесс деплоя

