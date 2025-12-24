# Backend API

NestJS backend для платформы прогнозных рынков с Prisma ORM, PostgreSQL и Redis.

## Технологии

- **NestJS** - Фреймворк
- **Prisma** - ORM
- **PostgreSQL** - База данных
- **Redis** - Кэширование
- **JWT** - Аутентификация
- **RBAC** - Роли и разрешения

## Установка

```bash
npm install
```

## Настройка базы данных

1. Создайте файл `.env` на основе `.env.example`
2. Настройте `DATABASE_URL`
3. Примените миграции:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Структура модулей

- `auth` - Аутентификация и авторизация
- `users` - Управление пользователями
- `categories` - Категории рынков
- `markets` - Рынки прогнозов
- `bets` - Ставки
- `payments` - Платежи
- `payouts` - Выплаты
- `analytics` - Аналитика
- `admin` - Админ панель

## API Endpoints

Все endpoints имеют префикс `/api`

### Авторизация
- `POST /api/auth/telegram` - Авторизация через Telegram
- `GET /api/auth/me` - Получить текущего пользователя

### Пользователи
- `GET /api/users/me` - Мой профиль
- `GET /api/users` - Список пользователей (admin/moderator)

### Категории
- `GET /api/categories` - Список категорий
- `GET /api/categories/:id` - Детали категории

### Рынки
- `GET /api/markets` - Список рынков
- `GET /api/markets/:id` - Детали рынка

### Ставки
- `POST /api/bets` - Создать ставку
- `GET /api/bets` - Мои ставки

### Платежи
- `GET /api/payments/transactions` - История транзакций

### Выплаты
- `GET /api/payouts` - Мои выплаты

### Аналитика
- `POST /api/analytics/track` - Трекинг события
- `GET /api/analytics/stats` - Статистика (admin/analyst)

### Админ
- `GET /api/admin/dashboard` - Дашборд (admin)
- `GET /api/admin/audit-logs` - Логи аудита (admin)

## RBAC

Используются роли и разрешения:
- **Роли**: user, admin, moderator, analyst
- **Разрешения**: market:create, market:edit, user:view, и т.д.

Декораторы:
- `@Roles('admin')` - Требует роль
- `@Permissions('market:create')` - Требует разрешение
