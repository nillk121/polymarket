# 🚀 Быстрый деплой на Railway (5 минут)

## Шаг 1: Подготовка

1. Зарегистрируйтесь на [railway.app](https://railway.app) через GitHub
2. Убедитесь, что ваш код залит в GitHub

## Шаг 2: Деплой Backend

1. **Создайте новый проект:**
   - New Project → Deploy from GitHub repo
   - Выберите ваш репозиторий

2. **Добавьте PostgreSQL:**
   - New → Database → PostgreSQL
   - Скопируйте `DATABASE_URL` из переменных окружения

3. **Добавьте Redis (опционально):**
   - New → Database → Redis
   - Скопируйте `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

4. **Настройте Backend сервис:**
   - Settings → Source → Root Directory: `/`
   - Settings → Build → Build Command: `npm install && npm run build --workspace=@polymarket/pricing-engine && npm run build --workspace=@polymarket/backend`
   - Settings → Deploy → Start Command: `cd apps/backend && npm run start:prod`

5. **Добавьте переменные окружения:**
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_HOST=${{Redis.REDIS_HOST}}
   REDIS_PORT=${{Redis.REDIS_PORT}}
   REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
   JWT_SECRET=сгенерируйте-случайную-строку-32-символа
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   TELEGRAM_BOT_TOKEN=ваш-токен-от-botfather
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://your-mini-app.up.railway.app
   TON_API_URL=https://tonapi.io
   MINI_APP_URL=https://your-mini-app.up.railway.app
   ```

6. **Запустите миграции:**
   - После первого деплоя, в Railway CLI или через терминал:
   ```bash
railway run --service backend -- cd apps/backend && npm run prisma:generate
railway run --service backend -- cd apps/backend && npm run prisma:migrate deploy
railway run --service backend -- cd apps/backend && npm run prisma:seed
   ```

## Шаг 3: Деплой Mini App

1. **Новый сервис:**
   - New → GitHub Repo → Выберите репозиторий

2. **Настройки:**
   - Root Directory: `apps/mini-app`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview` (или используйте nginx)

3. **Переменные:**
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```

4. **Обновите CORS в backend:**
   - Добавьте URL Mini App в `CORS_ORIGIN`

## Шаг 4: Деплой Web Dashboard

1. **Новый сервис:**
   - New → GitHub Repo → Выберите репозиторий

2. **Настройки:**
   - Root Directory: `apps/web-dashboard`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

3. **Переменные:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
   ```

## Шаг 5: Деплой Telegram Bot

1. **Новый сервис:**
   - New → GitHub Repo → Выберите репозиторий

2. **Настройки:**
   - Root Directory: `apps/telegram-bot`
   - Build Command: `npm install`
   - Start Command: `npm run start`

3. **Переменные:**
   ```
   TELEGRAM_BOT_TOKEN=ваш-токен-от-botfather
   API_URL=https://your-backend.up.railway.app/api
   MINI_APP_URL=https://your-mini-app.up.railway.app
   NODE_ENV=production
   ```

## Шаг 6: Настройка доменов

1. **В каждом сервисе:**
   - Settings → Domains → Generate Domain
   - Или добавьте свой домен

2. **Обновите переменные окружения:**
   - Замените все `*.up.railway.app` на ваши домены

## Готово! 🎉

Ваш проект должен быть доступен по адресам:
- Backend: `https://your-backend.up.railway.app/api`
- Mini App: `https://your-mini-app.up.railway.app`
- Dashboard: `https://your-dashboard.up.railway.app`

## Полезные команды Railway CLI

```bash
# Установка CLI
npm i -g @railway/cli

# Логин
railway login

# Подключение к проекту
railway link

# Просмотр логов
railway logs

# Запуск команд
railway run --service backend -- npm run prisma:migrate deploy
```

## Troubleshooting

**Проблема: Backend не запускается**
- Проверьте логи: `railway logs --service backend`
- Убедитесь, что все переменные окружения заполнены
- Проверьте, что миграции выполнены

**Проблема: Mini App не подключается к API**
- Проверьте `VITE_API_URL`
- Проверьте CORS настройки в backend
- Убедитесь, что backend запущен

**Проблема: Telegram Bot не отвечает**
- Проверьте `TELEGRAM_BOT_TOKEN`
- Проверьте логи бота
- Убедитесь, что webhook настроен (для production)

