#!/bin/bash

# Скрипт для быстрого деплоя на Railway
# Использование: ./scripts/deploy-railway.sh

set -e

echo "🚀 Начинаем деплой на Railway..."

# Проверка установки Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI не установлен"
    echo "📦 Установка Railway CLI..."
    npm i -g @railway/cli
fi

# Проверка авторизации
if ! railway whoami &> /dev/null; then
    echo "🔐 Требуется авторизация в Railway..."
    railway login
fi

echo "✅ Railway CLI готов"

# Создание проекта (если нужно)
read -p "Создать новый проект? (y/n): " create_new
if [ "$create_new" = "y" ]; then
    railway init
fi

# Деплой backend
echo "📦 Деплой Backend..."
cd apps/backend
railway up --service backend
cd ../..

# Запуск миграций
echo "🗄️  Запуск миграций базы данных..."
railway run --service backend -- cd apps/backend && npm run prisma:generate
railway run --service backend -- cd apps/backend && npm run prisma:migrate deploy

read -p "Запустить seed? (y/n): " run_seed
if [ "$run_seed" = "y" ]; then
    railway run --service backend -- cd apps/backend && npm run prisma:seed
fi

echo "✅ Деплой завершен!"
echo "📊 Просмотр логов: railway logs --service backend"

