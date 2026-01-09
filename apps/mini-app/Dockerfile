# Mini App Dockerfile для Fly.io (Static Site)
FROM node:18-alpine AS builder

WORKDIR /app

# Аргументы сборки для переменных окружения Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Копируем package файлы для кэширования зависимостей
COPY package*.json ./
COPY turbo.json ./

# Копируем package файлы из workspace
COPY apps/mini-app/package.json ./apps/mini-app/
COPY packages/*/package.json ./packages/*/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем mini-app (переменные Vite доступны на этапе сборки)
RUN npm run build --workspace=@polymarket/mini-app

# Production образ с nginx
FROM nginx:alpine AS runner

# Копируем собранное приложение
COPY --from=builder /app/apps/mini-app/dist /usr/share/nginx/html

# Настройка nginx для SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        return 404; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
