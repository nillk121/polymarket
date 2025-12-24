# Backend Setup Guide

## Инициализация NestJS Backend с Prisma

### 1. Установка зависимостей

```bash
cd apps/backend
npm install
```

### 2. Настройка базы данных

1. Создайте файл `.env`:
```bash
cp .env.example .env
```

2. Настройте `DATABASE_URL`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket?schema=public
```

3. Сгенерируйте Prisma Client:
```bash
npm run prisma:generate
```

4. Примените миграции:
```bash
npm run prisma:migrate
```

5. Заполните начальные данные:
```bash
npm run prisma:seed
```

### 3. Настройка Redis

Убедитесь, что Redis запущен:
```bash
# Docker
docker run -d -p 6379:6379 redis:alpine

# Или локально
redis-server
```

### 4. Запуск

```bash
# Development
npm run dev

# Production
npm run build
npm run start:prod
```

## Структура модулей

- ✅ `auth` - JWT аутентификация, RBAC
- ✅ `users` - Управление пользователями
- ✅ `categories` - Категории рынков
- ✅ `markets` - Рынки прогнозов
- ✅ `bets` - Ставки
- ✅ `payments` - Платежи
- ✅ `payouts` - Выплаты
- ✅ `analytics` - Аналитика
- ✅ `admin` - Админ панель

## RBAC (Roles & Permissions)

### Роли
- `user` - Обычный пользователь
- `admin` - Администратор
- `moderator` - Модератор
- `analyst` - Аналитик

### Использование

```typescript
// Требовать роль
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('protected')
async protectedRoute() {}

// Требовать разрешение
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('market:create')
@Post('markets')
async createMarket() {}
```

## Prisma Commands

```bash
# Генерация клиента
npm run prisma:generate

# Создание миграции
npm run prisma:migrate

# Открыть Prisma Studio
npm run prisma:studio

# Заполнить начальные данные
npm run prisma:seed
```
