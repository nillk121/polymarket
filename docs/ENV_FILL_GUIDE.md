# 📝 Как заполнить пустые переменные в .env файлах

## 🔍 Где находятся .env файлы?

- `apps/backend/.env` - Backend API
- `apps/telegram-bot/.env` - Telegram Bot
- `apps/mini-app/.env` - Mini App (опционально)
- `apps/web-dashboard/.env.local` - Admin Dashboard (опционально)

---

## 🔑 Backend (.env) - Строки 8-18

### TON API (строки 8-10)

```env
TON_API_URL=https://tonapi.io
TON_API_KEY=
TON_WEBHOOK_SECRET=
```

**TON_API_KEY:**
1. Зарегистрируйтесь на [TON API](https://tonapi.io/)
2. Перейдите в личный кабинет
3. Создайте API ключ
4. Скопируйте и вставьте в `TON_API_KEY`

**TON_WEBHOOK_SECRET:**
- Сгенерируйте случайную строку для верификации webhook
- Можно использовать команду:
  ```bash
  # Windows PowerShell
  -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
  
  # Linux/Mac
  openssl rand -hex 32
  ```
- Пример: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

### Telegram Wallet (строки 11-13)

```env
TELEGRAM_WALLET_WEBHOOK_SECRET=
TELEGRAM_WALLET_PROVIDER_TOKEN=
```

**TELEGRAM_WALLET_PROVIDER_TOKEN:**
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Выберите "Payments"
5. Настройте платежи через [@BotSupport](https://t.me/BotSupport)
6. Получите Provider Token
7. Вставьте в `TELEGRAM_WALLET_PROVIDER_TOKEN`

**TELEGRAM_WALLET_WEBHOOK_SECRET:**
- Сгенерируйте случайную строку (см. выше)
- Пример: `tg_wallet_secret_1234567890abcdef`

---

### Telegram Stars (строки 14-15)

```env
TELEGRAM_STARS_WEBHOOK_SECRET=
```

**TELEGRAM_STARS_WEBHOOK_SECRET:**
- Сгенерируйте случайную строку (см. выше)
- Пример: `tg_stars_secret_1234567890abcdef`

**Важно:** Telegram Stars доступны не во всех странах. Убедитесь, что ваш бот поддерживает Stars.

---

## 🤖 Telegram Bot (.env)

### Обязательные переменные:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
API_URL=http://localhost:3002/api
MINI_APP_URL=http://localhost:5173
```

**TELEGRAM_BOT_TOKEN:**
1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot` или `/token` для существующего бота
3. Следуйте инструкциям
4. Скопируйте токен

**API_URL:**
- Development: `http://localhost:3002/api`
- Production: `https://your-backend-domain.com/api`
- С Cloudflare Tunnel: `https://your-tunnel-url.trycloudflare.com/api`

**MINI_APP_URL:**
- Development: `http://localhost:5173` (не будет работать в Telegram без HTTPS)
- Production: `https://your-miniapp-domain.com`
- С Cloudflare Tunnel: `https://your-tunnel-url.trycloudflare.com`

---

## ⚠️ Важные замечания

### Для разработки (Development):

1. **TON_API_KEY** - можно оставить пустым, но некоторые функции не будут работать
2. **WEBHOOK_SECRET** - можно сгенерировать любую строку
3. **TELEGRAM_WALLET_PROVIDER_TOKEN** - нужен только если используете Telegram Wallet
4. **MINI_APP_URL** - для работы в Telegram нужен HTTPS (используйте Cloudflare Tunnel)

### Для продакшена (Production):

1. **Все секреты** должны быть уникальными и надежными
2. **TON_API_KEY** - обязателен для работы с TON
3. **WEBHOOK_SECRET** - используйте разные секреты для каждого провайдера
4. **MINI_APP_URL** - должен быть публичным HTTPS URL

---

## 🧪 Проверка настроек

После заполнения `.env` файлов:

1. **Backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```
   Проверьте, что нет ошибок о недостающих переменных

2. **Telegram Bot:**
   ```bash
   cd apps/telegram-bot
   npm run dev
   ```
   Проверьте, что бот запустился и отвечает на `/start`

3. **Проверка платежей:**
   - Отправьте `/deposit` в боте
   - Выберите способ пополнения
   - Проверьте, что создается платеж

---

## 📚 Дополнительная информация

- Подробная документация: [docs/ENV_SETUP.md](docs/ENV_SETUP.md)
- Настройка Cloudflare Tunnel: [docs/CLOUDFLARE_TUNNEL_SETUP.md](docs/CLOUDFLARE_TUNNEL_SETUP.md)
- Настройка платежей: [apps/backend/src/payments/README.md](apps/backend/src/payments/README.md)

