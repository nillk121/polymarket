# Web Dashboard - Админ панель

Next.js 14 админ панель для управления платформой прогнозных рынков.

## Возможности

- ✅ Аутентификация администраторов
- ✅ Управление рынками (создание, редактирование, разрешение)
- ✅ Управление категориями
- ✅ Управление Telegram каналами
- ✅ Управление постами в каналах
- ✅ Управление выплатами
- ✅ Просмотр аудит-логов

## Технологии

- **Next.js 14** - App Router
- **React Query** - Управление состоянием и кэширование
- **Tailwind CSS** - Стилизация
- **TypeScript** - Типизация
- **Axios** - HTTP клиент

## Установка

```bash
# Из корня монорепозитория
npm install

# Или из директории приложения
cd apps/web-dashboard
npm install
```

## Настройка

Создайте файл `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Запуск

```bash
# Из корня монорепозитория
npm run dev:web-dashboard

# Или из директории приложения
cd apps/web-dashboard
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3001

## Важно: Аутентификация

**Текущая версия backend не имеет отдельного админ-логина.**

Для работы админ-панели необходимо:

1. **Добавить эндпоинт в backend** (`apps/backend/src/auth/auth.controller.ts`):
   ```typescript
   @Post('admin/login')
   async adminLogin(@Body() credentials: { username: string; password: string }) {
     // Реализация админ-логина
   }
   ```

2. **Или использовать Telegram auth** (менее удобно для веб-панели)

## Структура

```
apps/web-dashboard/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Защищенные страницы
│   │   │   ├── page.tsx        # Дашборд
│   │   │   ├── markets/        # Управление рынками
│   │   │   ├── categories/     # Управление категориями
│   │   │   ├── channels/       # Управление каналами
│   │   │   ├── posts/          # Управление постами
│   │   │   ├── payouts/        # Управление выплатами
│   │   │   └── audit-logs/     # Аудит-логи
│   │   ├── login/              # Страница входа
│   │   └── layout.tsx          # Корневой layout
│   ├── components/
│   │   ├── layout/             # Компоненты layout
│   │   └── providers.tsx       # React Query provider
│   └── lib/
│       ├── api.ts              # Axios instance
│       ├── auth.ts             # API аутентификации
│       └── api-client.ts      # API клиенты для всех модулей
└── middleware.ts               # Middleware для защиты routes
```

## API Endpoints

Все endpoints требуют JWT токен в заголовке `Authorization: Bearer <token>`.

### Рынки
- `GET /markets` - Список рынков
- `POST /markets` - Создать рынок
- `PATCH /markets/:id` - Обновить рынок
- `POST /markets/:id/activate` - Активировать рынок
- `POST /markets/:id/lock` - Заблокировать рынок
- `POST /markets/:id/resolve` - Разрешить рынок
- `POST /markets/:id/cancel` - Отменить рынок

### Категории
- `GET /categories` - Список категорий
- `POST /categories` - Создать категорию
- `PATCH /categories/:id` - Обновить категорию
- `DELETE /categories/:id` - Удалить категорию

### Каналы
- `GET /channels` - Список каналов
- `POST /channels` - Подключить канал
- `PUT /channels/:id` - Обновить канал
- `DELETE /channels/:id` - Отключить канал

### Посты
- `GET /posts` - Список постов
- `POST /posts` - Создать пост
- `PUT /posts/:id` - Обновить пост
- `POST /posts/:id/publish` - Опубликовать пост
- `DELETE /posts/:id` - Удалить пост
- `GET /posts/:id/stats` - Статистика поста

### Выплаты
- `GET /payouts` - Список выплат
- `GET /payouts/:id` - Детали выплаты
- `POST /payouts/:id/retry` - Повторить выплату
- `GET /payouts/:id/audit` - Аудит-логи выплаты

### Админ
- `GET /admin/dashboard` - Статистика дашборда
- `GET /admin/audit-logs` - Аудит-логи

## Разработка

### Добавление новой страницы

1. Создайте файл в `src/app/(dashboard)/your-page/page.tsx`
2. Используйте `useQuery` и `useMutation` из React Query
3. Импортируйте API клиенты из `@/lib/api-client`

### Добавление нового API эндпоинта

1. Добавьте метод в соответствующий API клиент в `src/lib/api-client.ts`
2. Используйте его в компонентах через React Query

## Сборка

```bash
npm run build
npm run start
```
