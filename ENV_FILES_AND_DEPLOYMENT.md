# 📋 Файлы переменных окружения и рекомендации по деплою

## 🔐 Необходимые .env файлы

### 1. Backend (`apps/backend/.env`)

**Обязательные переменные:**

```env
# База данных PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# JWT Аутентификация
JWT_SECRET=your-secret-key-min-32-characters-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (опционально, но рекомендуется)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Сервер
PORT=3002
NODE_ENV=production
CORS_ORIGIN=https://your-mini-app-domain.com,https://your-dashboard-domain.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-from-botfather
TELEGRAM_BOT_USERNAME=your_bot_username

# TON API (для платежей)
TON_API_URL=https://tonapi.io
TON_API_KEY=your-ton-api-key
TON_WEBHOOK_SECRET=your-webhook-secret-for-ton
TON_SYSTEM_WALLET_ADDRESS=your-system-wallet-address

# Telegram Wallet (опционально)
TELEGRAM_WALLET_WEBHOOK_SECRET=your-telegram-wallet-webhook-secret
TELEGRAM_WALLET_PROVIDER_TOKEN=your-telegram-wallet-provider-token

# Telegram Stars (опционально)
TELEGRAM_STARS_WEBHOOK_SECRET=your-telegram-stars-webhook-secret

# Mini App URL (для deep links)
MINI_APP_URL=https://your-mini-app-domain.com
```

**Как получить значения:**
- `DATABASE_URL` - получите из вашего PostgreSQL провайдера
- `JWT_SECRET` - сгенерируйте: `openssl rand -base64 32` (Linux/Mac) или `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))` (Windows PowerShell)
- `TELEGRAM_BOT_TOKEN` - получите от [@BotFather](https://t.me/BotFather)
- `TON_API_KEY` - зарегистрируйтесь на [tonapi.io](https://tonapi.io)
- Webhook secrets - сгенерируйте случайные строки (минимум 32 символа)

---

### 2. Mini App (`apps/mini-app/.env`)

**Обязательные переменные:**

```env
# Backend API URL
VITE_API_URL=https://your-backend-domain.com/api
```

**Важно:** В Vite переменные должны начинаться с `VITE_` чтобы быть доступными в клиентском коде.

---

### 3. Telegram Bot (`apps/telegram-bot/.env`)

**Обязательные переменные:**

```env
# Telegram Bot Token (тот же, что в backend)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-from-botfather

# Backend API URL
API_URL=https://your-backend-domain.com/api

# Mini App URL
MINI_APP_URL=https://your-mini-app-domain.com

# Node Environment
NODE_ENV=production

# Webhook URL (только для production с webhook режимом)
WEBHOOK_URL=https://your-bot-domain.com/webhook
```

---

### 4. Web Dashboard (`apps/web-dashboard/.env.local`)

**Обязательные переменные:**

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

**Важно:** В Next.js публичные переменные должны начинаться с `NEXT_PUBLIC_`.

---

## 🚀 Бесплатные платформы для деплоя (альтернативы Railway)

### 1. **Render.com** ⭐ Рекомендуется

**Бесплатный тариф:**
- 750 часов в месяц
- PostgreSQL база данных (бесплатно)
- Redis (встроенный в платформу)
- Автоматический деплой из GitHub
- HTTPS по умолчанию
- Кастомные домены

**Деплой Backend:**
1. Создайте новый Web Service
2. Подключите GitHub репозиторий
3. Настройки:
   - **Build Command:** `npm install && npm run build --workspace=@polymarket/backend`
   - **Start Command:** `cd apps/backend && npm run start:prod`
   - **Environment:** Node
   - **Node Version:** 18+
4. Добавьте PostgreSQL database (создаст `DATABASE_URL` автоматически)
5. Добавьте переменные окружения

**Деплой Mini App (Static Site):**
1. Создайте Static Site
2. Настройки:
   - **Build Command:** `cd apps/mini-app && npm install && npm run build`
   - **Publish Directory:** `apps/mini-app/dist`

**Деплой Web Dashboard:**
1. Аналогично Mini App, но:
   - **Build Command:** `cd apps/web-dashboard && npm install && npm run build`
   - **Publish Directory:** `apps/web-dashboard/.next`

**Деплой Telegram Bot:**
1. Создайте Background Worker
2. **Start Command:** `cd apps/telegram-bot && npm run start`

**Плюсы:**
- ✅ Простая настройка
- ✅ Бесплатная PostgreSQL
- ✅ Автоматический HTTPS
- ✅ GitHub интеграция

**Минусы:**
- ⚠️ Приложения засыпают после 15 минут бездействия (на бесплатном тарифе)
- ⚠️ Холодный старт занимает ~30 секунд

---

### 2. **Fly.io** ⭐ Хорошо для production

**Бесплатный тариф:**
- 3 shared-cpu-1x VMs
- 3GB persistent storage
- PostgreSQL (Postgres app)
- Redis (можно запустить на VM)

**Деплой:**
1. Установите Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Логин: `fly auth login`
3. Создайте приложение: `fly launch`
4. Настройте `fly.toml` для каждого сервиса
5. Деплой: `fly deploy`

**Плюсы:**
- ✅ Не засыпает
- ✅ Глобальная сеть (low latency)
- ✅ PostgreSQL доступен
- ✅ Docker-based деплой

**Минусы:**
- ⚠️ Нужно больше ручной настройки
- ⚠️ Требуется CLI для управления

---

### 3. **Vercel** (только для Frontend)

**Бесплатный тариф:**
- Неограниченные деплои
- HTTPS автоматически
- Edge Network
- Serverless Functions

**Деплой Mini App:**
1. Подключите GitHub репозиторий
2. Настройки:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/mini-app`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

**Деплой Web Dashboard:**
1. Аналогично, но:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web-dashboard`

**Плюсы:**
- ✅ Отлично для статики и Next.js
- ✅ Очень быстрый
- ✅ Автоматический HTTPS

**Минусы:**
- ❌ Не подходит для backend (только Serverless Functions)
- ❌ Нет PostgreSQL

---

### 4. **Netlify** (только для Frontend)

**Бесплатный тариф:**
- 100GB bandwidth
- 300 build minutes
- HTTPS автоматически

**Деплой:**
Аналогично Vercel, но используйте Netlify.

**Плюсы:**
- ✅ Простая настройка
- ✅ Отлично для статики

**Минусы:**
- ❌ Не подходит для backend
- ❌ Нет PostgreSQL

---

### 5. **Supabase** (только для PostgreSQL)

**Бесплатный тариф:**
- 500MB база данных
- 2GB bandwidth
- Автоматические backup

**Использование:**
1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте `DATABASE_URL` из настроек проекта
3. Используйте этот URL в других платформах (Render, Fly.io)

**Плюсы:**
- ✅ Бесплатная PostgreSQL
- ✅ Автоматические backup
- ✅ Хорошая документация

---

### 6. **Neon** (только для PostgreSQL)

**Бесплатный тариф:**
- 0.5GB база данных
- Автоматическое масштабирование
- Branching для базы данных

**Использование:**
1. Создайте проект на [neon.tech](https://neon.tech)
2. Скопируйте connection string
3. Используйте в других платформах

**Плюсы:**
- ✅ Serverless PostgreSQL
- ✅ Автоматическое масштабирование
- ✅ Branching (как git для БД)

---

### 7. **Cloudflare Pages + Workers**

**Бесплатный тариф:**
- Неограниченные запросы
- 100K requests/day для Workers
- HTTPS автоматически

**Использование:**
- **Pages:** для статики (Mini App, Dashboard)
- **Workers:** для простых API (но не подходит для полноценного backend с Prisma)

**Плюсы:**
- ✅ Очень быстрый (Edge Network)
- ✅ Неограниченный bandwidth

**Минусы:**
- ⚠️ Workers не поддерживают все Node.js модули (Prisma может не работать)
- ❌ Нет PostgreSQL

---

## 🎯 Рекомендуемая конфигурация для тестирования

### Вариант 1: Render.com (самый простой) ⭐

```
Backend:        Render.com Web Service + PostgreSQL
Mini App:       Render.com Static Site
Web Dashboard:  Render.com Static Site
Telegram Bot:   Render.com Background Worker
Database:       Render.com PostgreSQL (бесплатно)
Redis:          Render.com Redis (опционально, платно) или пропустить
```

**Примерная стоимость:** $0/месяц

---

### Вариант 2: Гибридный (оптимальный)

```
Backend:        Fly.io
Mini App:       Vercel
Web Dashboard:  Vercel
Telegram Bot:   Fly.io
Database:       Neon или Supabase
Redis:          Fly.io (на VM) или пропустить
```

**Примерная стоимость:** $0/месяц

---

### Вариант 3: Все на Fly.io

```
Backend:        Fly.io App
Mini App:       Fly.io App (статический сайт)
Web Dashboard:  Fly.io App (статический сайт)
Telegram Bot:   Fly.io App
Database:       Fly.io Postgres App
Redis:          Fly.io App (redis)
```

**Примерная стоимость:** $0/месяц (если укладываетесь в лимиты)

---

## 📝 Шаги для деплоя на Render.com

### 1. Backend

1. Зайдите на [render.com](https://render.com)
2. New → Web Service
3. Подключите GitHub репозиторий
4. Настройки:
   ```
   Name: polymarket-backend
   Environment: Node
   Build Command: npm install && npm run build --workspace=@polymarket/backend
   Start Command: cd apps/backend && npm run start:prod
   ```
5. Создайте PostgreSQL database (New → PostgreSQL)
6. Скопируйте `DATABASE_URL` из PostgreSQL
7. Добавьте переменные окружения:
   ```
   DATABASE_URL=<из PostgreSQL>
   JWT_SECRET=<сгенерируйте>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   PORT=3002
   NODE_ENV=production
   TELEGRAM_BOT_TOKEN=<ваш токен>
   CORS_ORIGIN=https://your-mini-app.onrender.com
   MINI_APP_URL=https://your-mini-app.onrender.com
   ```
8. После первого деплоя запустите миграции через SSH или через Environment:
   ```bash
   cd apps/backend && npm run prisma:generate && npm run prisma:migrate deploy && npm run prisma:seed
   ```

### 2. Mini App

1. New → Static Site
2. Подключите GitHub репозиторий
3. Настройки:
   ```
   Name: polymarket-mini-app
   Build Command: cd apps/mini-app && npm install && npm run build
   Publish Directory: apps/mini-app/dist
   ```
4. Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

### 3. Web Dashboard

1. Аналогично Mini App, но:
   ```
   Name: polymarket-dashboard
   Build Command: cd apps/web-dashboard && npm install && npm run build
   Publish Directory: apps/web-dashboard/.next
   ```
2. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```

### 4. Telegram Bot

1. New → Background Worker
2. Настройки:
   ```
   Name: polymarket-telegram-bot
   Build Command: cd apps/telegram-bot && npm install
   Start Command: cd apps/telegram-bot && npm run start
   ```
3. Environment Variables:
   ```
   TELEGRAM_BOT_TOKEN=<ваш токен>
   API_URL=https://your-backend.onrender.com/api
   MINI_APP_URL=https://your-mini-app.onrender.com
   NODE_ENV=production
   ```

---

## 🔒 Безопасность

1. **Никогда не коммитьте `.env` файлы в git** (убедитесь, что они в `.gitignore`)
2. **Используйте разные секреты для разных окружений** (dev, staging, production)
3. **Генерируйте сильные секретные ключи** (минимум 32 символа)
4. **Ограничьте доступ к переменным окружения** на платформах деплоя
5. **Используйте Environment Variables на платформах деплоя**, а не .env файлы

---

## 🐛 Troubleshooting

### Backend не запускается

1. Проверьте логи на платформе деплоя
2. Убедитесь, что все переменные окружения заполнены
3. Проверьте, что миграции выполнены
4. Проверьте подключение к базе данных

### Mini App не подключается к API

1. Проверьте `VITE_API_URL` (должен начинаться с `https://`)
2. Проверьте CORS настройки в backend
3. Убедитесь, что backend запущен и доступен

### Telegram Bot не отвечает

1. Проверьте `TELEGRAM_BOT_TOKEN`
2. Проверьте логи бота
3. Для production убедитесь, что webhook настроен (если используется)

---

## 📚 Полезные ссылки

- [Render.com Documentation](https://render.com/docs)
- [Fly.io Documentation](https://fly.io/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Neon Documentation](https://neon.tech/docs)

---

**Последнее обновление:** 2024
