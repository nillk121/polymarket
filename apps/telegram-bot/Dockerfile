# Telegram Bot Dockerfile для Fly.io
FROM node:18-alpine AS base

WORKDIR /app

# Копируем package файлы для кэширования зависимостей
COPY package*.json ./
COPY turbo.json ./

# Копируем package файлы из workspace
COPY apps/telegram-bot/package.json ./apps/telegram-bot/
COPY packages/*/package.json ./packages/*/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем telegram-bot
RUN npm run build --workspace=@polymarket/telegram-bot

# Production образ
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Копируем package файлы
COPY package*.json ./
COPY turbo.json ./
COPY apps/telegram-bot/package.json ./apps/telegram-bot/
COPY packages/*/package.json ./packages/*/

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Копируем собранное приложение
COPY --from=base /app/apps/telegram-bot/dist ./apps/telegram-bot/dist
COPY --from=base /app/packages ./packages

WORKDIR /app/apps/telegram-bot

CMD ["node", "dist/index.js"]
