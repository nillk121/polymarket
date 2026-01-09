# Web Dashboard Dockerfile для Fly.io (Next.js)
FROM node:18-alpine AS base

# Установка необходимых инструментов
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Аргументы сборки для переменных окружения Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Копируем package файлы для кэширования зависимостей
COPY package*.json ./
COPY turbo.json ./

# Копируем package файлы из workspace
COPY apps/web-dashboard/package.json ./apps/web-dashboard/
COPY packages/*/package.json ./packages/*/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем Next.js приложение (переменные NEXT_PUBLIC_* доступны на этапе сборки)
RUN npm run build --workspace=@polymarket/web-dashboard

# Production образ
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Копируем package файлы
COPY package*.json ./
COPY turbo.json ./
COPY apps/web-dashboard/package.json ./apps/web-dashboard/
COPY packages/*/package.json ./packages/*/

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Копируем собранное приложение
COPY --from=base /app/apps/web-dashboard/.next ./apps/web-dashboard/.next
COPY --from=base /app/apps/web-dashboard/public ./apps/web-dashboard/public
COPY --from=base /app/apps/web-dashboard/next.config.js ./apps/web-dashboard/
COPY --from=base /app/packages ./packages

WORKDIR /app/apps/web-dashboard

EXPOSE 3001

CMD ["npm", "run", "start"]
