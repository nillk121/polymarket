# 🚀 Деплой на Fly.io - Полная инструкция

## 📋 Требования

1. Установите Fly CLI:
   
   **Windows (PowerShell):**
   ```powershell
   iwr https://fly.io/install.ps1 -useb | iex
   ```
   
   **macOS/Linux:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
   
   **Примечание для Windows:** Команда `curl ... | sh` НЕ работает в PowerShell! Используйте команду `iwr ... | iex` выше.

2. Войдите в аккаунт:
   ```bash
   fly auth login
   ```

3. Убедитесь, что проект закоммичен в GitHub (для автоматического деплоя)

---

## 🗄️ Шаг 1: Создание PostgreSQL базы данных

```bash
# Создайте PostgreSQL базу данных
fly postgres create --name polymarket-db --region iad

# Дождитесь создания базы данных (это может занять несколько минут)
# Затем получите connection string:
fly postgres connect -a polymarket-db
```

**Примечание:** После создания БД, Fly.io автоматически предоставит переменную `DATABASE_URL` при подключении к приложению.

---

## 🔧 Шаг 2: Настройка Backend

### 2.1. Инициализация Backend приложения

```bash
cd apps/backend

# Инициализация Fly.io приложения
fly launch --name polymarket-backend --region iad

# При запросе:
# - Use existing fly.toml? → Yes
# - PostgreSQL? → Yes, attach existing (выберите polymarket-db)
# - Redis? → No (опционально)
# - Deploy now? → No (сначала настроим переменные окружения)
```

### 2.2. Настройка переменных окружения

```bash
# Подключите PostgreSQL (автоматически добавит DATABASE_URL)
fly postgres attach --app polymarket-backend

# Добавьте остальные переменные окружения
fly secrets set \
  JWT_SECRET="your-jwt-secret-min-32-characters" \
  JWT_EXPIRES_IN="15m" \
  JWT_REFRESH_EXPIRES_IN="7d" \
  PORT="3002" \
  NODE_ENV="production" \
  TELEGRAM_BOT_TOKEN="your-telegram-bot-token" \
  TELEGRAM_BOT_USERNAME="your_bot_username" \
  TON_API_URL="https://tonapi.io" \
  TON_API_KEY="your-ton-api-key" \
  TON_WEBHOOK_SECRET="your-webhook-secret" \
  CORS_ORIGIN="https://polymarket-mini-app.fly.dev,https://polymarket-dashboard.fly.dev" \
  MINI_APP_URL="https://polymarket-mini-app.fly.dev"

# Обновите после получения URL Mini App и Dashboard
```

**Генерация JWT_SECRET:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 2.3. Деплой Backend

```bash
# Деплой из корня репозитория (build context будет корень)
fly deploy --config apps/backend/fly.toml

# Примечание: Build context - это текущая директория (корень репозитория)
# Dockerfile указан в fly.toml: apps/backend/Dockerfile
```

### 2.4. Запуск миграций Prisma

```bash
# Подключитесь к машине и запустите миграции
fly ssh console -a polymarket-backend

# Внутри контейнера:
cd /app/apps/backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Или выполните команду напрямую:
fly ssh console -a polymarket-backend -C "cd /app/apps/backend && npx prisma generate && npx prisma migrate deploy && npx prisma db seed"
```

**Получите URL Backend:**
```bash
fly info -a polymarket-backend
# Запишите URL, например: https://polymarket-backend.fly.dev
```

---

## 🎨 Шаг 3: Настройка Mini App

### 3.1. Инициализация Mini App

```bash
cd apps/mini-app

# Инициализация Fly.io приложения
fly launch --name polymarket-mini-app --region iad

# При запросе:
# - Use existing fly.toml? → Yes
# - Deploy now? → No
```

### 3.2. Настройка переменных окружения

```bash
# Добавьте переменную окружения с URL Backend
fly secrets set \
  VITE_API_URL="https://polymarket-backend.fly.dev/api"

# Важно: Vite требует пересборку при изменении переменных окружения
```

### 3.3. Обновление Dockerfile для сборки с переменными

Переменные окружения в Vite доступны только на этапе сборки. Нужно пересобрать Dockerfile:

```dockerfile
# Добавьте в Dockerfile перед сборкой:
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Затем при сборке передайте аргумент:
# docker build --build-arg VITE_API_URL=https://polymarket-backend.fly.dev/api
```

**Альтернативный способ:** Используйте fly.toml для передачи build args:

```toml
[build]
  dockerfile = "Dockerfile"
  build_args = { VITE_API_URL = "https://polymarket-backend.fly.dev/api" }
```

### 3.4. Деплой Mini App

```bash
# Деплой из корня репозитория
fly deploy --config apps/mini-app/fly.toml
```

**Получите URL Mini App:**
```bash
fly info -a polymarket-mini-app
# Запишите URL, например: https://polymarket-mini-app.fly.dev
```

---

## 📊 Шаг 4: Настройка Web Dashboard

### 4.1. Инициализация Web Dashboard

```bash
cd apps/web-dashboard

# Инициализация Fly.io приложения
fly launch --name polymarket-dashboard --region iad

# При запросе:
# - Use existing fly.toml? → Yes
# - Deploy now? → No
```

### 4.2. Настройка переменных окружения

```bash
# Добавьте переменную окружения с URL Backend
fly secrets set \
  NEXT_PUBLIC_API_URL="https://polymarket-backend.fly.dev/api"

# Next.js требует переменные NEXT_PUBLIC_* на этапе сборки
```

### 4.3. Деплой Web Dashboard

```bash
# Деплой из корня репозитория
fly deploy --config apps/web-dashboard/fly.toml
```

**Получите URL Dashboard:**
```bash
fly info -a polymarket-dashboard
# Запишите URL, например: https://polymarket-dashboard.fly.dev
```

---

## 🤖 Шаг 5: Настройка Telegram Bot

### 5.1. Инициализация Telegram Bot

```bash
cd apps/telegram-bot

# Инициализация Fly.io приложения (background worker)
fly launch --name polymarket-telegram-bot --region iad

# При запросе:
# - Use existing fly.toml? → Yes
# - HTTP service? → No (это background worker)
# - Deploy now? → No
```

### 5.2. Настройка переменных окружения

```bash
# Добавьте переменные окружения
fly secrets set \
  TELEGRAM_BOT_TOKEN="your-telegram-bot-token" \
  API_URL="https://polymarket-backend.fly.dev/api" \
  MINI_APP_URL="https://polymarket-mini-app.fly.dev" \
  NODE_ENV="production"

# Для webhook режима (опционально):
# fly secrets set WEBHOOK_URL="https://your-bot-domain.com/webhook"
```

### 5.3. Деплой Telegram Bot

```bash
# Деплой из корня репозитория
fly deploy --config apps/telegram-bot/fly.toml
```

---

## 🔄 Шаг 6: Обновление переменных окружения

После деплоя всех сервисов обновите CORS и URL в Backend:

```bash
cd apps/backend

fly secrets set \
  CORS_ORIGIN="https://polymarket-mini-app.fly.dev,https://polymarket-dashboard.fly.dev" \
  MINI_APP_URL="https://polymarket-mini-app.fly.dev"

# Перезапустите Backend
fly apps restart -a polymarket-backend
```

---

## 📝 Скрипты для автоматизации

### Автоматический деплой всех сервисов

Создайте `scripts/deploy-fly.sh`:

```bash
#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Деплой на Fly.io${NC}"

# Backend
echo -e "\n${GREEN}1. Деплой Backend...${NC}"
cd apps/backend
fly deploy
cd ../..

# Mini App
echo -e "\n${GREEN}2. Деплой Mini App...${NC}"
cd apps/mini-app
fly deploy
cd ../..

# Web Dashboard
echo -e "\n${GREEN}3. Деплой Web Dashboard...${NC}"
cd apps/web-dashboard
fly deploy
cd ../..

# Telegram Bot
echo -e "\n${GREEN}4. Деплой Telegram Bot...${NC}"
cd apps/telegram-bot
fly deploy
cd ../..

echo -e "\n${GREEN}✅ Деплой завершен!${NC}"
```

**Использование:**
```bash
chmod +x scripts/deploy-fly.sh
./scripts/deploy-fly.sh
```

---

## 🔍 Полезные команды Fly.io

### Просмотр логов

```bash
# Backend
fly logs -a polymarket-backend

# Mini App
fly logs -a polymarket-mini-app

# Web Dashboard
fly logs -a polymarket-dashboard

# Telegram Bot
fly logs -a polymarket-telegram-bot

# Следить за логами в реальном времени
fly logs -a polymarket-backend --follow
```

### Просмотр информации о приложении

```bash
# Получить URL приложения
fly info -a polymarket-backend

# Статус приложения
fly status -a polymarket-backend

# Список всех приложений
fly apps list
```

### Управление переменными окружения

```bash
# Просмотр всех секретов
fly secrets list -a polymarket-backend

# Установка секрета
fly secrets set KEY="value" -a polymarket-backend

# Удаление секрета
fly secrets unset KEY -a polymarket-backend
```

### Подключение к контейнеру

```bash
# SSH подключение
fly ssh console -a polymarket-backend

# Выполнить команду
fly ssh console -a polymarket-backend -C "ls -la"
```

### Масштабирование

```bash
# Изменить количество инстансов
fly scale count 2 -a polymarket-backend

# Изменить размер VM
fly scale vm shared-cpu-1x --memory 1024 -a polymarket-backend
```

---

## 🐛 Troubleshooting

### Backend не запускается

1. **Проверьте логи:**
   ```bash
   fly logs -a polymarket-backend
   ```

2. **Проверьте переменные окружения:**
   ```bash
   fly secrets list -a polymarket-backend
   ```

3. **Проверьте подключение к БД:**
   ```bash
   fly ssh console -a polymarket-backend
   cd /app/apps/backend
   npx prisma db pull
   ```

### Миграции не выполняются

```bash
# Подключитесь к контейнеру и выполните вручную
fly ssh console -a polymarket-backend
cd /app/apps/backend
npx prisma generate
npx prisma migrate deploy
```

### Mini App не подключается к API

1. **Проверьте CORS в Backend:**
   ```bash
   fly secrets get CORS_ORIGIN -a polymarket-backend
   ```

2. **Проверьте VITE_API_URL:**
   ```bash
   fly secrets get VITE_API_URL -a polymarket-mini-app
   ```

3. **Пересоберите Mini App** (переменные Vite доступны только на этапе сборки):
   ```bash
   cd apps/mini-app
   fly deploy --build-only
   ```

### Telegram Bot не отвечает

1. **Проверьте токен:**
   ```bash
   fly secrets get TELEGRAM_BOT_TOKEN -a polymarket-telegram-bot
   ```

2. **Проверьте логи:**
   ```bash
   fly logs -a polymarket-telegram-bot --follow
   ```

3. **Проверьте подключение к Backend:**
   ```bash
   fly secrets get API_URL -a polymarket-telegram-bot
   ```

---

## 💰 Стоимость (бесплатный тариф)

Fly.io бесплатный тариф включает:
- **3 shared-cpu-1x VMs** (256MB RAM каждая)
- **3GB persistent storage**
- **160GB outbound data transfer**

**Рекомендации для экономии:**
- Mini App и Dashboard можно объединить на одной VM (используя nginx)
- Backend: 512MB RAM (1 VM)
- Telegram Bot: 256MB RAM (1 VM)
- Frontend (Mini App + Dashboard): 256MB RAM (1 VM) на nginx
- PostgreSQL: отдельный платный сервис или используйте Neon/Supabase

---

## 🎯 Итоговая конфигурация

После деплоя у вас будет:

- ✅ **Backend:** `https://polymarket-backend.fly.dev/api`
- ✅ **Mini App:** `https://polymarket-mini-app.fly.dev`
- ✅ **Web Dashboard:** `https://polymarket-dashboard.fly.dev`
- ✅ **Telegram Bot:** Работает в фоновом режиме
- ✅ **PostgreSQL:** `polymarket-db` (Fly Postgres)

---

## 📚 Дополнительные ресурсы

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io PostgreSQL](https://fly.io/docs/postgres/)
- [Fly.io Deploy](https://fly.io/docs/app-guides/continuous-deployment-with-github-actions/)

---

**Готово!** Ваш проект развернут на Fly.io! 🎉
