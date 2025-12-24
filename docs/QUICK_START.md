# 🚀 Быстрый старт проекта

## 📋 Предварительные требования

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14 (или Docker)
- **Redis** (или Docker)

---

## 1️⃣ Установка зависимостей

```bash
# Из корня проекта
npm install
```

Это установит все зависимости для всех приложений и пакетов в монорепозитории.

---

## 2️⃣ Настройка базы данных

### Вариант A: Локальный PostgreSQL

1. Установите PostgreSQL
2. Создайте базу данных:
   ```sql
   CREATE DATABASE polymarket;
   ```

3. Обновите `apps/backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/polymarket?schema=public
   ```

### Вариант B: Docker (рекомендуется)

```bash
# Запустите PostgreSQL и Redis через Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=polymarket -p 5432:5432 postgres:14
docker run -d --name redis -p 6379:6379 redis:alpine
```

---

## 3️⃣ Настройка переменных окружения

### Backend (`apps/backend/.env`)

**Обязательные переменные:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket?schema=public
JWT_SECRET=your-secret-key-change-in-production
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

**Как получить Telegram Bot Token:**
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Скопируйте токен в `.env`

**Остальные переменные (опционально):**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Mini App (`apps/mini-app/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

### Telegram Bot (`apps/telegram-bot/.env`)

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
API_URL=http://localhost:3000/api
MINI_APP_URL=http://localhost:5173
```

### Web Dashboard (`apps/web-dashboard/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 4️⃣ Инициализация базы данных

```bash
cd apps/backend

# Генерация Prisma Client
npm run prisma:generate

# Применение миграций
npm run prisma:migrate

# Заполнение начальных данных (опционально)
npm run prisma:seed
```

---

## 5️⃣ Запуск приложений

### Вариант A: Запуск всех приложений отдельно

**Backend:**
```bash
cd apps/backend
npm run dev
```
Сервер будет доступен на `http://localhost:3000/api`

**Mini App:**
```bash
cd apps/mini-app
npm run dev
```
Приложение будет доступно на `http://localhost:5173`

**Web Dashboard:**
```bash
cd apps/web-dashboard
npm run dev
```
Панель будет доступна на `http://localhost:3001`

**Telegram Bot:**
```bash
cd apps/telegram-bot
npm run dev
```

### Вариант B: Запуск через Turborepo (из корня)

```bash
# Запуск всех приложений одновременно
npm run dev

# Или запуск конкретного приложения
npm run dev:backend
npm run dev:mini-app
npm run dev:web-dashboard
npm run dev:telegram-bot
```

---

## 6️⃣ Проверка работы

### Backend Health Check

```bash
curl http://localhost:3000/api/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

### Mini App

Откройте `http://localhost:5173` в браузере или через Telegram Mini App.

### Web Dashboard

Откройте `http://localhost:3001` в браузере.

---

## 🔧 Troubleshooting

### Проблема: Backend не подключается к базе данных

**Решение:**
1. Проверьте, что PostgreSQL запущен
2. Проверьте правильность `DATABASE_URL` в `.env`
3. Убедитесь, что база данных `polymarket` создана

### Проблема: Redis connection error

**Решение:**
1. Проверьте, что Redis запущен
2. Проверьте `REDIS_HOST` и `REDIS_PORT` в `.env`
3. Если Redis не нужен для разработки, можно временно закомментировать кэширование

### Проблема: Mini App не может подключиться к API

**Решение:**
1. Проверьте, что backend запущен на порту 3000
2. Проверьте `VITE_API_URL` в `apps/mini-app/.env`
3. Проверьте CORS настройки в backend

### Проблема: Telegram Bot не отвечает

**Решение:**
1. Проверьте правильность `TELEGRAM_BOT_TOKEN` в `.env`
2. Убедитесь, что бот запущен
3. Проверьте логи на ошибки

### Проблема: Prisma migration errors

**Решение:**
```bash
cd apps/backend
# Сброс базы данных (ОСТОРОЖНО: удалит все данные!)
npx prisma migrate reset

# Или применить миграции заново
npx prisma migrate deploy
```

---

## 📚 Дополнительная документация

- [Настройка переменных окружения](ENV_SETUP.md)
- [Backend Setup](../apps/backend/BACKEND_SETUP.md)
- [Backend Quickstart](../apps/backend/QUICKSTART.md)
- [Структура проекта](STRUCTURE.md)

---

## ✅ Чеклист перед запуском

- [ ] Node.js >= 18 установлен
- [ ] PostgreSQL установлен и запущен
- [ ] Redis установлен и запущен (опционально)
- [ ] Все зависимости установлены (`npm install`)
- [ ] `.env` файлы созданы для всех приложений
- [ ] `TELEGRAM_BOT_TOKEN` настроен в `.env`
- [ ] База данных создана
- [ ] Prisma миграции применены
- [ ] Backend запускается без ошибок

---

**Готово! 🎉 Проект должен работать.**

