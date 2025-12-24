# 🔄 Обновление .env файлов с URL Cloudflare Tunnels

## 📋 URL туннелей

Скопируйте эти значения в соответствующие .env файлы:

### Backend Tunnel
```
https://europe-willow-delegation-enjoyed.trycloudflare.com
```

### Mini App Tunnel
```
https://speaking-grande-prospective-bookmarks.trycloudflare.com
```

### Dashboard Tunnel
```
https://bookmark-fell-fitness-trial.trycloudflare.com
```

---

## 📝 Инструкция по обновлению

### 1. apps/telegram-bot/.env

Создайте или откройте файл `apps/telegram-bot/.env` и установите:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
API_URL=https://europe-willow-delegation-enjoyed.trycloudflare.com/api
MINI_APP_URL=https://speaking-grande-prospective-bookmarks.trycloudflare.com
NODE_ENV=development
```

**Важно:** Замените `your_telegram_bot_token_here` на ваш реальный токен бота.

---

### 2. apps/mini-app/.env

Создайте или откройте файл `apps/mini-app/.env` и установите:

```env
VITE_API_URL=https://europe-willow-delegation-enjoyed.trycloudflare.com/api
```

---

### 3. apps/web-dashboard/.env.local

Создайте или откройте файл `apps/web-dashboard/.env.local` и установите:

```env
NEXT_PUBLIC_API_URL=https://europe-willow-delegation-enjoyed.trycloudflare.com/api
```

---

## ✅ Проверка

После обновления файлов:

1. **Убедитесь, что бэкенд запущен:**
   ```bash
   cd apps/backend
   npm run dev
   ```
   Должно появиться: `🚀 Сервер запущен на порту 3002`

2. **Перезапустите все приложения:**
   ```bash
   npm run dev
   ```

3. **Проверьте логи бота:**
   Должно быть:
   ```
   🔗 Telegram Bot API URL: https://europe-willow-delegation-enjoyed.trycloudflare.com/api
   ```

---

## 🔄 Если туннели перезапустились

Если вы перезапустили туннели и получили новые URL:

1. Скопируйте новые URL из вывода `cloudflared`
2. Обновите соответствующие .env файлы
3. Перезапустите приложения

---

## 💡 Альтернатива: Использование localhost

Для разработки можно использовать localhost вместо туннелей:

**apps/telegram-bot/.env:**
```env
API_URL=http://localhost:3002/api
MINI_APP_URL=http://localhost:5173
```

**apps/mini-app/.env:**
```env
VITE_API_URL=http://localhost:3002/api
```

**apps/web-dashboard/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

**Примечание:** Mini App с localhost не будет работать в Telegram (нужен HTTPS), но для тестирования бота это нормально.

