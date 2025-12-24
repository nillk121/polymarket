# Database Indexes Strategy

## Критические индексы для производительности

### 1. Users Table
- `idx_users_telegram_id` - **UNIQUE** - Основной поиск пользователей
- `idx_users_username` - Частичный индекс для поиска по username
- `idx_users_is_active` - Фильтрация активных пользователей
- `idx_users_created_at` - Сортировка по дате регистрации

### 2. Markets Table
- `idx_markets_slug` - **UNIQUE** - Поиск по URL
- `idx_markets_status` - Фильтрация по статусу (open/closed/resolved)
- `idx_markets_category` - Группировка по категориям
- `idx_markets_created_at` - Сортировка новых рынков
- `idx_markets_end_date` - Поиск рынков с истекающим сроком
- `idx_markets_telegram_channel` - Связь с Telegram каналами

### 3. Bets Table
- `idx_bets_user` - История ставок пользователя
- `idx_bets_market` - Ставки по рынку
- `idx_bets_status` - Фильтрация по статусу
- `idx_bets_user_market` - **COMPOSITE** - Быстрый поиск ставок пользователя по рынку
- `idx_bets_market_status` - **COMPOSITE** - Активные ставки по рынку

### 4. Transactions Table
- `idx_transactions_user` - История транзакций
- `idx_transactions_type` - Фильтрация по типу
- `idx_transactions_status` - Фильтрация по статусу
- `idx_transactions_user_type` - **COMPOSITE** - Транзакции пользователя по типу
- `idx_transactions_user_status` - **COMPOSITE** - Транзакции пользователя по статусу
- `idx_transactions_external_id` - Поиск внешних транзакций

### 5. Analytics Events Table
- `idx_analytics_events_user` - События пользователя
- `idx_analytics_events_type` - Фильтрация по типу события
- `idx_analytics_events_created_at` - Временной анализ
- `idx_analytics_events_user_type` - **COMPOSITE** - События пользователя по типу
- `idx_analytics_events_created_at_type` - **COMPOSITE** - Временной анализ по типу

### 6. Balances Table
- `idx_balances_wallet_currency` - **UNIQUE** - Баланс кошелька в валюте
- `idx_balances_wallet` - Все балансы кошелька

## Частичные индексы

Используются для оптимизации запросов с условиями WHERE:

1. `idx_users_username` - Только для не-NULL значений
2. `idx_wallets_address` - Только для кошельков с адресом
3. `idx_markets_telegram_channel` - Только для рынков с каналом
4. `idx_transactions_external_id` - Только для внешних транзакций
5. `idx_analytics_events_session` - Только для событий с сессией
6. `idx_analytics_events_referral` - Только для событий с реферальным кодом

## Составные индексы

Оптимизируют запросы с несколькими условиями:

1. `idx_bets_user_market` - (user_id, market_id) - История ставок пользователя по рынку
2. `idx_bets_market_status` - (market_id, status) - Активные ставки по рынку
3. `idx_transactions_user_type` - (user_id, type) - Транзакции пользователя по типу
4. `idx_transactions_user_status` - (user_id, status) - Транзакции пользователя по статусу
5. `idx_analytics_events_user_type` - (user_id, event_type) - События пользователя по типу
6. `idx_analytics_events_created_at_type` - (created_at, event_type) - Временной анализ

## Рекомендации по оптимизации

### Для больших таблиц (analytics_events, transactions)

1. **Партиционирование по дате**
```sql
-- Пример для analytics_events
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

2. **Архивирование старых данных**
- Перемещение данных старше 1 года в архивную таблицу
- Использование pg_partman для автоматизации

3. **Индексы только на активных данных**
- Частичные индексы для активных записей
- Удаление индексов на архивных данных

### Мониторинг производительности

```sql
-- Найти неиспользуемые индексы
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Найти медленные запросы
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Обслуживание индексов

```sql
-- Анализ таблиц для обновления статистики
ANALYZE users;
ANALYZE markets;
ANALYZE bets;
ANALYZE transactions;

-- Пересоздание индексов (если необходимо)
REINDEX INDEX CONCURRENTLY idx_bets_user_market;

-- Очистка индексов
VACUUM ANALYZE users;
VACUUM ANALYZE markets;
VACUUM ANALYZE bets;
```

