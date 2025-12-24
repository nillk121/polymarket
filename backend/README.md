# Backend API

NestJS backend для платформы прогнозных рынков.

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните необходимые переменные окружения.

## Запуск

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Авторизация
- `POST /auth/telegram` - Авторизация через Telegram
- `GET /auth/me` - Получить текущего пользователя

### Рынки
- `GET /markets` - Список рынков
- `GET /markets/:id` - Детали рынка
- `POST /markets` - Создать рынок (только админ)
- `POST /markets/:id/resolve` - Разрешить рынок (только админ)

### Заказы
- `POST /orders` - Создать заказ
- `GET /orders` - Мои заказы
- `GET /orders/:id` - Детали заказа

### Пользователи
- `GET /users/me` - Мой профиль
- `PUT /users/referral` - Установить реферальный код

### Админ
- `GET /admin/dashboard` - Статистика дашборда

### Аналитика
- `GET /analytics/stats` - Общая статистика
- `GET /analytics/attribution` - Статистика по рефералам

## База данных

Используется PostgreSQL. Схема создается автоматически в development режиме.

