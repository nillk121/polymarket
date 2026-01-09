# Backend Dockerfile для Fly.io
FROM node:18-alpine AS base

# Установка необходимых инструментов
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Копируем package файлы для кэширования зависимостей
COPY package*.json ./
COPY turbo.json ./

# Копируем package файлы из workspace
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Устанавливаем зависимости
RUN npm ci

# Копируем Prisma схему
COPY apps/backend/prisma ./apps/backend/prisma

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate
WORKDIR /app

# Собираем backend и зависимости
RUN npm run build --workspace=@polymarket/backend

# Production образ
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Копируем package файлы
COPY package*.json ./
COPY turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Копируем собранное приложение
COPY --from=base /app/apps/backend/dist ./apps/backend/dist
COPY --from=base /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=base /app/packages ./packages

WORKDIR /app/apps/backend

EXPOSE 3002

CMD ["node", "dist/main.js"]
