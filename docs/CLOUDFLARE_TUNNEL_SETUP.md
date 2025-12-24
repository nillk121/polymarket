# 🌐 Настройка Cloudflare Tunnel для HTTPS в Dev режиме

Этот гайд поможет настроить HTTPS для локальной разработки с помощью Cloudflare Tunnel, чтобы использовать Web App кнопки в Telegram боте.

## 📋 Что это дает

- ✅ HTTPS для Mini App (требуется для Telegram Web App)
- ✅ Кнопка меню слева в Telegram боте
- ✅ Web App кнопки работают в dev режиме
- ✅ Бесплатно и без ограничений

## 🚀 Быстрая установка

### 1. Установка Cloudflare Tunnel

#### Windows (PowerShell)
```powershell
# Скачайте установщик с официального сайта
# Или используйте winget:
winget install --id Cloudflare.cloudflared
```

#### Альтернативный способ (через npm)
```bash
npm install -g cloudflared
```

### 2. Авторизация

```bash
cloudflared tunnel login
```

Это откроет браузер для авторизации через Cloudflare аккаунт. Если у вас нет аккаунта, создайте бесплатный на [cloudflare.com](https://dash.cloudflare.com/sign-up).

### 3. Создание туннеля

```bash
# Создайте туннель
cloudflared tunnel create polymarket-dev

# Запишите Tunnel ID, который будет выведен
```

### 4. Настройка конфигурации

Создайте файл `cloudflared-config.yml` в корне проекта:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:\Users\<YOUR_USERNAME>\.cloudflared\<TUNNEL_ID>.json

ingress:
  # Mini App (Vite dev server)
  - hostname: polymarket-mini-app.your-domain.workers.dev
    service: http://localhost:5173
  
  # Web Dashboard (Next.js)
  - hostname: polymarket-dashboard.your-domain.workers.dev
    service: http://localhost:3001
  
  # Backend API (NestJS)
  - hostname: polymarket-api.your-domain.workers.dev
    service: http://localhost:3002
  
  # Catch-all правило (должно быть последним)
  - service: http_status:404
```

**Важно:** Замените:
- `<YOUR_TUNNEL_ID>` на ID вашего туннеля
- `<YOUR_USERNAME>` на ваше имя пользователя Windows
- `your-domain.workers.dev` на ваш домен (или используйте бесплатный workers.dev домен)

### 5. Запуск туннеля

```bash
cloudflared tunnel --config cloudflared-config.yml run
```

Или добавьте в `package.json`:

```json
{
  "scripts": {
    "tunnel": "cloudflared tunnel --config cloudflared-config.yml run"
  }
}
```

Запуск:
```bash
npm run tunnel
```

## 🔧 Упрощенная настройка (без конфига)

Если не хотите создавать конфиг, можно использовать простые команды:

### Для Mini App:
```bash
cloudflared tunnel --url http://localhost:5173
```

Это даст вам HTTPS URL вида: `https://random-subdomain.trycloudflare.com`

### Для Backend:
```bash
cloudflared tunnel --url http://localhost:3002
```

## 📝 Обновление переменных окружения

После получения HTTPS URL, обновите `.env` файлы:

### `apps/telegram-bot/.env`
```env
TELEGRAM_BOT_TOKEN=your_token
API_URL=https://your-backend-url.trycloudflare.com/api
MINI_APP_URL=https://your-mini-app-url.trycloudflare.com
```

### `apps/mini-app/.env`
```env
VITE_API_URL=https://your-backend-url.trycloudflare.com/api
```

### `apps/web-dashboard/.env.local`
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.trycloudflare.com/api
```

### `apps/backend/.env`
```env
CORS_ORIGIN=https://your-mini-app-url.trycloudflare.com,https://your-dashboard-url.trycloudflare.com
```

## 🎯 Автоматизация с npm scripts

Добавьте в корневой `package.json`:

```json
{
  "scripts": {
    "tunnel:mini-app": "cloudflared tunnel --url http://localhost:5173",
    "tunnel:backend": "cloudflared tunnel --url http://localhost:3002",
    "tunnel:dashboard": "cloudflared tunnel --url http://localhost:3001",
    "dev:with-tunnel": "concurrently \"npm run dev\" \"npm run tunnel:backend\""
  }
}
```

## ⚠️ Важные замечания

1. **URL меняется при каждом запуске** (если используете `trycloudflare.com`)
   - Для постоянного URL используйте свой домен и конфиг файл

2. **Несколько туннелей**
   - Можно запустить несколько туннелей в разных терминалах
   - Или использовать один туннель с конфигом (рекомендуется)

3. **Безопасность**
   - В dev режиме это нормально
   - В production используйте постоянный домен и настройте DNS

## 🚀 Быстрый старт (рекомендуемый способ)

1. Установите cloudflared:
   ```bash
   npm install -g cloudflared
   ```

2. Запустите туннель для backend:
   ```bash
   cloudflared tunnel --url http://localhost:3002
   ```
   Скопируйте полученный HTTPS URL (например: `https://abc123.trycloudflare.com`)

3. Запустите туннель для mini-app:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
   Скопируйте полученный HTTPS URL

4. Обновите `.env` файлы с полученными URL

5. Перезапустите проект:
   ```bash
   npm run dev
   ```

6. Кнопка меню в Telegram боте теперь должна работать! 🎉

## 🔍 Проверка

После настройки:

1. Откройте Telegram бота
2. Отправьте `/start`
3. Слева должна появиться кнопка "🚀 Запустить приложение"
4. Кнопка должна открывать Mini App

## 📚 Дополнительные ресурсы

- [Cloudflare Tunnel документация](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Бесплатный домен workers.dev](https://developers.cloudflare.com/workers/platform/workers-for-platforms/)

