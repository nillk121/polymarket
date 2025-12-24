# Database Schema

Полная схема базы данных для платформы прогнозных рынков.

## Быстрый старт

### Применение миграции

```bash
# Используя psql
psql -U postgres -d polymarket -f src/database/migrations/001-initial-schema.sql

# Или через TypeORM
npm run migration:run
```

### Проверка схемы

```sql
-- Список всех таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Список всех индексов
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Основные таблицы

### Пользователи и авторизация
- `users` - Пользователи
- `roles` - Роли
- `permissions` - Разрешения
- `role_permissions` - Связь ролей и разрешений
- `user_roles` - Связь пользователей и ролей

### Кошельки и балансы
- `wallets` - Кошельки
- `balances` - Балансы

### Рынки
- `categories` - Категории
- `markets` - Рынки
- `outcomes` - Исходы
- `liquidity_pools` - Пул ликвидности

### Ставки и транзакции
- `bets` - Ставки
- `transactions` - Транзакции
- `payouts` - Выплаты

### Telegram
- `telegram_channels` - Каналы
- `posts` - Посты
- `post_templates` - Шаблоны постов

### Реферальная система
- `referral_links` - Реферальные ссылки
- `user_referrals` - Отслеживание рефералов

### Аналитика
- `traffic_sources` - Источники трафика
- `analytics_events` - События аналитики

### Администрирование
- `admin_audit_logs` - Логи аудита

## Важные ограничения

1. **Балансы**: amount >= 0, locked_amount >= 0, available_amount >= 0
2. **Вероятности**: probability BETWEEN 0 AND 1
3. **Суммы**: Все денежные суммы > 0
4. **Статусы**: Используются enum-значения

## Производительность

### Критические индексы
- `users.telegram_id` - Для быстрого поиска пользователей
- `markets.status` - Для фильтрации активных рынков
- `bets.user_id, market_id` - Для истории ставок
- `transactions.user_id, type, status` - Для финансовых операций
- `analytics_events.created_at, event_type` - Для аналитики

### Партиционирование (опционально)
Для больших таблиц (`analytics_events`, `transactions`) можно использовать партиционирование по дате.

## Безопасность

1. Все внешние ключи с `ON DELETE CASCADE` или `ON DELETE SET NULL`
2. Ограничения на уровне БД для валидации данных
3. Индексы для быстрого поиска
4. Триггеры для автоматического обновления `updated_at`

## Миграции

Схема создается через SQL миграцию `001-initial-schema.sql`. Для дальнейших изменений используйте TypeORM миграции.

