# ⚡ Fly.io - Быстрый старт (5 минут)

## 🎯 Что уже готово

✅ Все Dockerfile созданы  
✅ Все fly.toml конфигурации готовы  
✅ Скрипты автоматизации созданы  
✅ Инструкции написаны  

## 🚀 Быстрая команда

```powershell
# Windows (PowerShell) - Установите Fly CLI
iwr https://fly.io/install.ps1 -useb | iex

# macOS/Linux - Установите Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Войдите в аккаунт
fly auth login

# 3. Создайте PostgreSQL базу данных
fly postgres create --name polymarket-db --region iad

# 4. Деплой Backend (из корня репозитория)
cd apps/backend
fly launch --name polymarket-backend --region iad
# Выберите: Yes, attach existing PostgreSQL (polymarket-db)

# 5. Настройте переменные окружения
fly secrets set \
  JWT_SECRET="$(openssl rand -base64 32)" \
  TELEGRAM_BOT_TOKEN="your-token" \
  PORT="3002" \
  NODE_ENV="production" \
  -a polymarket-backend

# 6. Деплой
fly deploy

# 7. Запустите миграции
fly ssh console -a polymarket-backend -C "cd /app/apps/backend && npx prisma generate && npx prisma migrate deploy"
```

## 📋 Деплой всех сервисов

```bash
# Автоматический деплой всех сервисов
chmod +x scripts/deploy-fly.sh
./scripts/deploy-fly.sh

# Или вручную для каждого:
cd apps/backend && fly deploy && cd ../..
cd apps/mini-app && fly deploy && cd ../..
cd apps/web-dashboard && fly deploy && cd ../..
cd apps/telegram-bot && fly deploy && cd ../..
```

## 🔗 Полезные команды

```bash
# Логи
fly logs -a polymarket-backend --follow

# Статус
fly status -a polymarket-backend

# Переменные окружения
fly secrets list -a polymarket-backend

# SSH подключение
fly ssh console -a polymarket-backend

# Перезапуск
fly apps restart -a polymarket-backend
```

## 📚 Подробная инструкция

**См. [DEPLOY_FLY_IO.md](./DEPLOY_FLY_IO.md)** для полной документации

---

**Готово!** 🎉
