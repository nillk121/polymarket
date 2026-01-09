#!/bin/bash

# Скрипт для автоматического деплоя всех сервисов на Fly.io
# Использование: ./scripts/deploy-fly.sh

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Деплой всех сервисов на Fly.io${NC}\n"

# Проверка наличия Fly CLI
if ! command -v fly &> /dev/null; then
    echo -e "${YELLOW}⚠️  Fly CLI не установлен. Установите его:${NC}"
    echo "   macOS/Linux: curl -L https://fly.io/install.sh | sh"
    echo "   Windows (PowerShell): iwr https://fly.io/install.ps1 -useb | iex"
    exit 1
fi

# Переходим в корень репозитория (build context должен быть корень репозитория)
cd "$(dirname "$0")/.."

# Проверяем, что мы в корне репозитория
if [ ! -f "package.json" ] || [ ! -f "turbo.json" ]; then
    echo -e "${YELLOW}⚠️  Скрипт должен запускаться из корня репозитория${NC}"
    exit 1
fi

# 1. Backend
echo -e "${GREEN}1. Деплой Backend...${NC}"
fly deploy --config apps/backend/fly.toml || {
    echo -e "${YELLOW}⚠️  Деплой Backend не удался. Продолжаем...${NC}"
}

# 2. Mini App
echo -e "\n${GREEN}2. Деплой Mini App...${NC}"
fly deploy --config apps/mini-app/fly.toml || {
    echo -e "${YELLOW}⚠️  Деплой Mini App не удался. Продолжаем...${NC}"
}

# 3. Web Dashboard
echo -e "\n${GREEN}3. Деплой Web Dashboard...${NC}"
fly deploy --config apps/web-dashboard/fly.toml || {
    echo -e "${YELLOW}⚠️  Деплой Web Dashboard не удался. Продолжаем...${NC}"
}

# 4. Telegram Bot
echo -e "\n${GREEN}4. Деплой Telegram Bot...${NC}"
fly deploy --config apps/telegram-bot/fly.toml || {
    echo -e "${YELLOW}⚠️  Деплой Telegram Bot не удался. Продолжаем...${NC}"
}

echo -e "\n${GREEN}✅ Деплой завершен!${NC}"
echo -e "\n${BLUE}📋 Следующие шаги:${NC}"
echo "1. Проверьте логи: fly logs -a polymarket-backend"
echo "2. Выполните миграции Prisma в Backend"
echo "3. Обновите переменные окружения (CORS, URLs)"
echo "4. Проверьте работу всех сервисов"
