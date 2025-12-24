# Настройка переменных окружения

Этот документ содержит инструкции по настройке `.env` файлов для всех приложений в монорепозитории.

## 📋 Содержание

- [Backend (.env)](#backend-env)
- [Mini App (.env)](#mini-app-env)
- [Telegram Bot (.env)](#telegram-bot-env)
- [Проверка настроек](#проверка-настроек)

---

## Backend (.env)

Файл: `apps/backend/.env`

### База данных

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/polymarket?schema=public
```

**Описание:** URL подключения к PostgreSQL базе данных.

**Формат:** `postgresql://username:password@host:port/database?schema=public`

**Примеры:**
- Локально: `postgresql://postgres:postgres@localhost:5432/polymarket?schema=public`
- Docker: `postgresql://postgres:postgres@postgres:5432/polymarket?schema=public`
- Production: `postgresql://user:password@db.example.com:5432/polymarket?schema=public`

### JWT Аутентификация

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Описание:**
- `JWT_SECRET` - Секретный ключ для подписи JWT токенов. **ОБЯЗАТЕЛЬНО измените в production!**
- `JWT_EXPIRES_IN` - Время жизни access token (по умолчанию 15 минут)
- `JWT_REFRESH_EXPIRES_IN` - Время жизни refresh token (по умолчанию 7 дней)

**Генерация секретного ключа:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Telegram

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

**Описание:** Токен Telegram бота, полученный от [@BotFather](https://t.me/BotFather).

**Как получить:**
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям
4. Скопируйте полученный токен

### Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Описание:** Настройки подключения к Redis для кэширования.

**Примеры:**
- Локально: `REDIS_HOST=localhost`, `REDIS_PORT=6379`
- Docker: `REDIS_HOST=redis`, `REDIS_PORT=6379`
- Production с паролем: `REDIS_HOST=redis.example.com`, `REDIS_PORT=6379`, `REDIS_PASSWORD=your-password`

### Сервер

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Описание:**
- `PORT` - Порт, на котором будет работать сервер (по умолчанию 3000)
- `NODE_ENV` - Режим работы (`development` или `production`)
- `CORS_ORIGIN` - Разрешенный origin для CORS (URL вашего фронтенда)

### TON API

```env
TON_API_URL=https://tonapi.io
TON_API_KEY=
TON_WEBHOOK_SECRET=
```

**Описание:** Настройки для интеграции с TON API.

**Как получить API ключ:**
1. Зарегистрируйтесь на [TON API](https://tonapi.io/)
2. Получите API ключ в личном кабинете
3. Установите `TON_API_KEY`

**Webhook Secret:** Сгенерируйте случайную строку для верификации webhook от TON.

### Telegram Wallet

```env
TELEGRAM_WALLET_WEBHOOK_SECRET=
TELEGRAM_WALLET_PROVIDER_TOKEN=
```

**Описание:** Настройки для Telegram Wallet платежей.

**Как получить Provider Token:**
1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Настройте платежи через [@BotSupport](https://t.me/BotSupport)
3. Получите Provider Token

**Webhook Secret:** Сгенерируйте случайную строку для верификации webhook.

### Telegram Stars

```env
TELEGRAM_STARS_WEBHOOK_SECRET=
```

**Описание:** Настройки для Telegram Stars платежей.

**Webhook Secret:** Сгенерируйте случайную строку для верификации webhook.

---

## Mini App (.env)

Файл: `apps/mini-app/.env`

### API URL

```env
VITE_API_URL=http://localhost:3000/api
```

**Описание:** URL бэкенд API для Mini App.

**Примеры:**
- Development: `http://localhost:3000/api`
- Production: `https://api.yourdomain.com/api`

**Важно:** В Vite переменные окружения должны начинаться с `VITE_` чтобы быть доступными в клиентском коде.

---

## Telegram Bot (.env)

Файл: `apps/telegram-bot/.env`

### Telegram Bot Token

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

**Описание:** Токен Telegram бота (тот же, что и в backend).

**Как получить:** См. раздел [Telegram](#telegram) выше.

### Backend API URL

```env
API_URL=http://localhost:3000/api
```

**Описание:** URL бэкенд API для бота.

**Примеры:**
- Development: `http://localhost:3000/api`
- Production: `https://api.yourdomain.com/api`

### Mini App URL

```env
MINI_APP_URL=https://your-mini-app.com
```

**Описание:** URL вашего Mini App для создания deep links.

**Примеры:**
- Development: `http://localhost:5173`
- Production: `https://your-mini-app.com`

**Как получить:**
1. Разверните Mini App на хостинге
2. Получите URL от Telegram через [@BotFather](https://t.me/BotFather) → Bot Settings → Menu Button

### Webhook URL (Production)

```env
WEBHOOK_URL=https://your-domain.com/webhook
```

**Описание:** URL для webhook в production режиме.

**Примеры:**
- Production: `https://bot.yourdomain.com/webhook`

**Настройка webhook:**
1. Разверните бота на сервере
2. Настройте HTTPS endpoint для webhook
3. Установите webhook через API: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEBHOOK_URL>`

### Node Environment

```env
NODE_ENV=development
```

**Описание:** Режим работы (`development` или `production`).

---

## Проверка настроек

### Backend

```bash
cd apps/backend
npm run dev
```

**Ожидаемый результат:**
- ✅ Сервер запускается на порту 3000
- ✅ Подключение к базе данных успешно
- ✅ Redis подключен (если настроен)

### Mini App

```bash
cd apps/mini-app
npm run dev
```

**Ожидаемый результат:**
- ✅ Dev сервер запускается на порту 5173
- ✅ Переменная `VITE_API_URL` доступна в коде

### Telegram Bot

```bash
cd apps/telegram-bot
npm run dev
```

**Ожидаемый результат:**
- ✅ Бот запускается в polling режиме
- ✅ Команда `/start` работает
- ✅ API запросы к backend успешны

---

## Безопасность

### ⚠️ Важные рекомендации:

1. **Никогда не коммитьте `.env` файлы в git!**
   - Убедитесь, что `.env` в `.gitignore`
   - Используйте `.env.example` для шаблонов

2. **Используйте разные секретные ключи для разных окружений:**
   - Development
   - Staging
   - Production

3. **Генерируйте сильные секретные ключи:**
   - Минимум 32 символа
   - Случайные символы
   - Не используйте простые пароли

4. **Ограничьте доступ к `.env` файлам:**
   - Только необходимые пользователи
   - Правильные права доступа (chmod 600)

5. **Используйте переменные окружения на сервере:**
   - Не храните секреты в коде
   - Используйте секретные менеджеры (AWS Secrets Manager, HashiCorp Vault)

---

## Troubleshooting

### Проблема: Backend не подключается к базе данных

**Решение:**
1. Проверьте, что PostgreSQL запущен
2. Проверьте правильность `DATABASE_URL`
3. Проверьте права доступа пользователя БД

### Проблема: Mini App не может подключиться к API

**Решение:**
1. Проверьте, что backend запущен
2. Проверьте `VITE_API_URL` в `.env`
3. Проверьте CORS настройки в backend

### Проблема: Telegram Bot не отвечает

**Решение:**
1. Проверьте правильность `TELEGRAM_BOT_TOKEN`
2. Проверьте, что бот запущен
3. Проверьте логи на ошибки

### Проблема: Webhook не работает

**Решение:**
1. Проверьте, что URL доступен извне
2. Проверьте HTTPS сертификат
3. Проверьте правильность `WEBHOOK_URL`

---

## Дополнительные ресурсы

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Prisma Environment Variables](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#env)

---

## Шаблоны .env файлов

Все шаблоны находятся в соответствующих директориях:
- `apps/backend/.env.example` (если создан)
- `apps/mini-app/.env.example` (если создан)
- `apps/telegram-bot/.env.example`

Используйте их как основу для создания ваших `.env` файлов.

---

**Последнее обновление:** 2024

