# Backend Dockerfile для Fly.io
FROM node:18-alpine AS base

# Установка необходимых инструментов (включая OpenSSL для Prisma)
RUN apk add --no-cache libc6-compat openssl openssl-dev

WORKDIR /app

# Копируем package файлы для кэширования зависимостей
COPY package*.json ./
COPY turbo.json ./

# Копируем package.json файлы из workspace (только для кэширования)
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/pricing-engine/package.json ./packages/pricing-engine/
COPY packages/analytics-sdk/package.json ./packages/analytics-sdk/

# Устанавливаем зависимости
# Используем npm install вместо npm ci для монорепозитория с workspaces
# npm ci требует полностью синхронизированный lock файл
RUN npm install --workspaces

# Копируем Prisma схему
COPY apps/backend/prisma ./apps/backend/prisma

# Копируем исходный код приложений (исключая node_modules и другие файлы)
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Копируем исходный код packages (только src и tsconfig, package.json уже скопированы)
COPY packages/shared-utils/src ./packages/shared-utils/src
COPY packages/shared-utils/tsconfig.json ./packages/shared-utils/
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/pricing-engine/src ./packages/pricing-engine/src
COPY packages/pricing-engine/tsconfig.json ./packages/pricing-engine/
COPY packages/analytics-sdk/src ./packages/analytics-sdk/src
COPY packages/analytics-sdk/tsconfig.json ./packages/analytics-sdk/

# Генерируем Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate
WORKDIR /app

# Собираем все workspace пакеты ПЕРЕД сборкой backend
# Порядок важен: сначала зависимости, потом backend
RUN npm run build --workspace=@polymarket/shared-types
RUN npm run build --workspace=@polymarket/shared-utils
RUN npm run build --workspace=@polymarket/pricing-engine
RUN npm run build --workspace=@polymarket/analytics-sdk

# Теперь собираем backend (который зависит от всех пакетов)
# NestJS требует запуска сборки из директории приложения
WORKDIR /app/apps/backend
RUN npm run build

# Проверяем структуру dist после сборки
RUN echo "=== Checking dist structure ===" && \
    find /app/apps/backend/dist -type f -name "*.js" 2>/dev/null | head -10 && \
    ls -la /app/apps/backend/dist/ 2>/dev/null | head -20

# Проверяем, что main.js существует и копируем его в корень dist если нужно
RUN MAIN_JS_PATH=$(find /app/apps/backend/dist -name "main.js" -type f 2>/dev/null | head -1) && \
    if [ -z "$MAIN_JS_PATH" ]; then \
        echo "ERROR: main.js not found! Full dist structure:"; \
        find /app/apps/backend/dist -type f 2>/dev/null | head -30; \
        ls -laR /app/apps/backend/dist/ 2>/dev/null | head -100; \
        exit 1; \
    else \
        echo "✓ Found main.js at: $MAIN_JS_PATH"; \
        # Если main.js не в корне dist, копируем его туда
        if [ "$MAIN_JS_PATH" != "/app/apps/backend/dist/main.js" ]; then \
            echo "⚠ main.js is at $MAIN_JS_PATH, copying to /app/apps/backend/dist/main.js"; \
            cp "$MAIN_JS_PATH" /app/apps/backend/dist/main.js || exit 1; \
            echo "✓ main.js copied to expected location"; \
        else \
            echo "✓ main.js is already in expected location"; \
        fi; \
    fi

WORKDIR /app

# Production образ
FROM node:18-alpine AS runner

# Установка OpenSSL для Prisma (нужен в production образе)
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

ENV NODE_ENV=production

# Копируем package файлы
COPY package*.json ./
COPY turbo.json ./
COPY apps/backend/package.json ./apps/backend/

# Копируем package.json файлы из каждого workspace явно (без wildcard)
# Это избегает конфликтов workspace
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/pricing-engine/package.json ./packages/pricing-engine/
COPY packages/analytics-sdk/package.json ./packages/analytics-sdk/

# Устанавливаем только production зависимости
# Используем npm install для монорепозитория
RUN npm install --workspaces --omit=dev

# Копируем собранное приложение
COPY --from=base /app/apps/backend/dist ./apps/backend/dist
COPY --from=base /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# Копируем собранные пакеты (dist директории и package.json для правильного резолва)
COPY --from=base /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=base /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=base /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=base /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=base /app/packages/pricing-engine/dist ./packages/pricing-engine/dist
COPY --from=base /app/packages/pricing-engine/package.json ./packages/pricing-engine/
COPY --from=base /app/packages/analytics-sdk/dist ./packages/analytics-sdk/dist
COPY --from=base /app/packages/analytics-sdk/package.json ./packages/analytics-sdk/

# Проверяем, что файл main.js скопирован в production образ (может быть в dist/src/main.js)
RUN ls -la /app/apps/backend/dist/ || (echo "ERROR: dist directory not found!" && ls -la /app/apps/backend/ && exit 1)
RUN (test -f /app/apps/backend/dist/main.js || test -f /app/apps/backend/dist/src/main.js) || (echo "ERROR: main.js not found in production image!" && find /app/apps/backend/dist -name "main.js" && ls -la /app/apps/backend/dist/ && exit 1)

WORKDIR /app/apps/backend

EXPOSE 3002

# Запускаем main.js из dist/src/main.js (где NestJS собирает файлы)
CMD ["node", "dist/src/main.js"]
