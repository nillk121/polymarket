# 🚀 Инструкция по деплою проекта

Этот документ содержит инструкции по деплою всех компонентов проекта на различные платформы.

## 📋 Варианты деплоя

### Вариант 1: Railway (Рекомендуется) ⭐

**Railway** - лучший вариант для монорепозиториев. Простой деплой, автоматические обновления, встроенная БД.

**Преимущества:**
- ✅ Бесплатный тариф ($5 кредитов в месяц)
- ✅ Автоматический деплой из GitHub
- ✅ Встроенная PostgreSQL и Redis
- ✅ Простая настройка переменных окружения
- ✅ HTTPS из коробки

**Стоимость:** ~$5-20/месяц (зависит от использования)

#### Шаги деплоя:

1. **Регистрация:**
   - Перейдите на [railway.app](https://railway.app)
   - Войдите через GitHub

2. **Деплой Backend:**
   ```bash
   # В Railway:
   - New Project → Deploy from GitHub repo
   - Выберите ваш репозиторий
   - Добавьте PostgreSQL (New → Database → PostgreSQL)
   - Добавьте Redis (New → Database → Redis)
   - Настройте переменные окружения (см. ниже)
   - Root Directory: /
   - Build Command: npm install && npm run build --workspace=@polymarket/pricing-engine && npm run build --workspace=@polymarket/backend
   - Start Command: cd apps/backend && npm run start:prod
   ```

3. **Переменные окружения для Backend:**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_HOST=${{Redis.REDIS_HOST}}
   REDIS_PORT=${{Redis.REDIS_PORT}}
   REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
   JWT_SECRET=your-secret-key-here
   TELEGRAM_BOT_TOKEN=your-bot-token
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://your-mini-app.railway.app,https://your-dashboard.railway.app
   TON_API_URL=https://tonapi.io
   TON_API_KEY=your-ton-api-key
   MINI_APP_URL=https://your-mini-app.railway.app
   ```

4. **Деплой Mini App:**
   - New Service → Deploy from GitHub
   - Root Directory: apps/mini-app
   - Build Command: npm install && npm run build
   - Start Command: npm run preview (или используйте nginx)
   - Переменные:
     ```env
     VITE_API_URL=https://your-backend.railway.app/api
     ```

5. **Деплой Web Dashboard:**
   - New Service → Deploy from GitHub
   - Root Directory: apps/web-dashboard
   - Build Command: npm install && npm run build
   - Start Command: npm run start
   - Переменные:
     ```env
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
     ```

6. **Деплой Telegram Bot:**
   - New Service → Deploy from GitHub
   - Root Directory: apps/telegram-bot
   - Build Command: npm install
   - Start Command: npm run start
   - Переменные:
     ```env
     TELEGRAM_BOT_TOKEN=your-bot-token
     API_URL=https://your-backend.railway.app/api
     MINI_APP_URL=https://your-mini-app.railway.app
     NODE_ENV=production
     ```

---

### Вариант 2: Render

**Render** - хорошая альтернатива с бесплатным тарифом.

**Преимущества:**
- ✅ Бесплатный тариф (с ограничениями)
- ✅ Автоматический деплой
- ✅ Встроенная PostgreSQL

**Ограничения бесплатного тарифа:**
- Сервисы "засыпают" после 15 минут бездействия
- Медленный старт после сна

#### Шаги деплоя:

1. **Регистрация:** [render.com](https://render.com)

2. **Деплой Backend:**
   - New → Web Service
   - Connect GitHub repo
   - Settings:
     - **Build Command:** `npm install && npm run build --workspace=@polymarket/pricing-engine && npm run build --workspace=@polymarket/backend`
     - **Start Command:** `cd apps/backend && npm run start:prod`
     - **Environment:** Node
     - **Node Version:** 18

3. **Добавьте PostgreSQL:**
   - New → PostgreSQL
   - Скопируйте Internal Database URL

4. **Переменные окружения** (те же, что для Railway)

---

### Вариант 3: Vercel (для фронтенда) + Railway/Render (для backend)

**Vercel** - лучший вариант для Next.js и статических сайтов.

#### Деплой Web Dashboard на Vercel:

1. **Регистрация:** [vercel.com](https://vercel.com)

2. **Деплой:**
   ```bash
   # Установите Vercel CLI
   npm i -g vercel
   
   # В корне проекта
   cd apps/web-dashboard
   vercel
   ```

3. **Настройка:**
   - Root Directory: `apps/web-dashboard`
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Environment Variables:
     ```env
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
     ```

#### Деплой Mini App на Vercel:

1. **Настройка Vite для Vercel:**
   - Создайте `vercel.json` в `apps/mini-app`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "devCommand": "npm run dev",
     "framework": "vite"
   }
   ```

2. **Деплой:**
   ```bash
   cd apps/mini-app
   vercel
   ```

---

### Вариант 4: Fly.io (Docker)

**Fly.io** - отлично подходит для Docker контейнеров.

#### Шаги:

1. **Установка CLI:**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Логин:**
   ```bash
   fly auth login
   ```

3. **Деплой Backend:**
   ```bash
   # Создайте fly.toml в корне проекта
   fly launch
   
   # Или используйте существующий Dockerfile
   fly deploy --dockerfile infra/docker/backend.Dockerfile
   ```

4. **Настройка переменных:**
   ```bash
   fly secrets set DATABASE_URL=postgresql://...
   fly secrets set JWT_SECRET=...
   # и т.д.
   ```

---

### Вариант 5: Self-hosted на VPS (Hetzner/DigitalOcean)

**Для полного контроля** - деплой на собственный VPS.

#### Требования:
- VPS с Ubuntu 22.04
- Минимум 2GB RAM, 2 CPU
- Docker и Docker Compose

#### Шаги:

1. **Подготовка сервера:**
   ```bash
   # SSH на сервер
   ssh root@your-server-ip
   
   # Установка Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Установка Docker Compose
   apt-get install docker-compose-plugin
   ```

2. **Клонирование репозитория:**
   ```bash
   git clone https://github.com/your-username/polymarket.git
   cd polymarket
   ```

3. **Настройка .env файлов:**
   ```bash
   # Скопируйте и заполните .env файлы
   cp apps/backend/.env.example apps/backend/.env
   # Заполните все переменные
   ```

4. **Запуск через Docker Compose:**
   ```bash
   cd infra/docker
   docker compose up -d
   ```

5. **Настройка Nginx (для HTTPS):**
   ```bash
   # Установка Nginx
   apt-get install nginx certbot python3-certbot-nginx
   
   # Настройка SSL
   certbot --nginx -d your-domain.com
   ```

6. **Настройка доменов:**
   - Backend: `api.yourdomain.com`
   - Mini App: `app.yourdomain.com`
   - Dashboard: `admin.yourdomain.com`

---

## 🔧 Настройка после деплоя

### 1. Миграции базы данных

После деплоя backend нужно запустить миграции:

```bash
# На сервере или через Railway CLI
cd apps/backend
npm run prisma:generate
npm run prisma:migrate deploy
npm run prisma:seed
```

### 2. Настройка Telegram Bot

1. **Получите токен бота:**
   - Откройте [@BotFather](https://t.me/BotFather)
   - `/newbot` или `/token` для существующего бота

2. **Настройте Webhook (для production):**
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://your-backend.railway.app/api/telegram/webhook"
   ```

3. **Настройте Mini App URL:**
   - [@BotFather](https://t.me/BotFather) → Ваш бот → Bot Settings → Menu Button
   - Укажите URL вашего Mini App

### 3. Настройка доменов

#### Для Railway:
- Settings → Domains → Add Custom Domain
- Настройте DNS записи:
  ```
  CNAME api -> your-backend.railway.app
  CNAME app -> your-mini-app.railway.app
  CNAME admin -> your-dashboard.railway.app
  ```

#### Для VPS:
- Настройте A записи:
  ```
  A api -> ваш-ip
  A app -> ваш-ip
  A admin -> ваш-ip
  ```

### 4. Обновление переменных окружения

После настройки доменов обновите:
- `CORS_ORIGIN` в backend
- `MINI_APP_URL` в backend и telegram-bot
- `API_URL` в mini-app и telegram-bot

---

## 📊 Рекомендуемая архитектура деплоя

```
┌─────────────────────────────────────────┐
│         Railway / Render / VPS          │
├─────────────────────────────────────────┤
│  Backend (NestJS)                       │
│  - API: api.yourdomain.com              │
│  - Port: 3000                           │
├─────────────────────────────────────────┤
│  PostgreSQL Database                    │
│  - Internal connection                  │
├─────────────────────────────────────────┤
│  Redis (опционально)                    │
│  - Internal connection                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Vercel / Railway                 │
├─────────────────────────────────────────┤
│  Mini App (React + Vite)                │
│  - URL: app.yourdomain.com              │
│  - Static files                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Vercel                          │
├─────────────────────────────────────────┤
│  Web Dashboard (Next.js)                 │
│  - URL: admin.yourdomain.com           │
│  - SSR                                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Railway / Render / VPS          │
├─────────────────────────────────────────┤
│  Telegram Bot                           │
│  - Webhook mode                         │
│  - Polling mode (dev)                   │
└─────────────────────────────────────────┘
```

---

## 🎯 Быстрый старт (Railway)

1. **Создайте аккаунт на Railway**
2. **Добавьте PostgreSQL и Redis**
3. **Деплойте Backend:**
   - Connect GitHub
   - Root: `/`
   - Build: `npm install && npm run build --filter=backend`
   - Start: `cd apps/backend && npm run start:prod`
4. **Настройте переменные окружения**
5. **Запустите миграции**
6. **Деплойте остальные сервисы**

---

## 💰 Стоимость (примерная)

### Railway:
- Backend: ~$5-10/месяц
- Mini App: ~$5/месяц
- Dashboard: ~$5/месяц
- Bot: ~$5/месяц
- PostgreSQL: ~$5/месяц
- Redis: ~$5/месяц
- **Итого: ~$30-40/месяц**

### Render (Free tier):
- Backend: Бесплатно (с ограничениями)
- Mini App: Бесплатно
- Dashboard: Бесплатно
- Bot: Бесплатно
- PostgreSQL: Бесплатно
- **Итого: Бесплатно** (для тестирования)

### VPS (Hetzner):
- VPS (4GB RAM): ~€4/месяц
- **Итого: ~€4/месяц** (самый дешевый вариант)

---

## 🔒 Безопасность

После деплоя обязательно:

1. ✅ Измените все секретные ключи (`JWT_SECRET`, webhook secrets)
2. ✅ Настройте HTTPS (автоматически на Railway/Vercel)
3. ✅ Ограничьте CORS origins
4. ✅ Настройте rate limiting
5. ✅ Регулярно обновляйте зависимости
6. ✅ Настройте мониторинг и логирование

---

## 📚 Дополнительные ресурсы

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Fly.io Docs](https://fly.io/docs)

---

**Рекомендация:** Начните с **Railway** для быстрого деплоя, затем при необходимости переходите на VPS для большей гибкости и контроля.

