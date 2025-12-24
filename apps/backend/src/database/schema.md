# Database Schema Documentation

## Обзор

Полная реляционная схема базы данных для платформы прогнозных рынков.

## Таблицы

### 1. Users & Authentication

#### users
Основная таблица пользователей.

**Поля:**
- `id` (UUID, PK) - Уникальный идентификатор
- `telegram_id` (VARCHAR(255), UNIQUE, NOT NULL) - Telegram ID пользователя
- `username` (VARCHAR(255)) - Имя пользователя
- `first_name` (VARCHAR(255)) - Имя
- `last_name` (VARCHAR(255)) - Фамилия
- `email` (VARCHAR(255)) - Email
- `phone` (VARCHAR(50)) - Телефон
- `avatar_url` (TEXT) - URL аватара
- `is_active` (BOOLEAN, DEFAULT true) - Активен ли пользователь
- `is_verified` (BOOLEAN, DEFAULT false) - Верифицирован ли
- `is_banned` (BOOLEAN, DEFAULT false) - Забанен ли
- `banned_until` (TIMESTAMP) - До какого времени забанен
- `ban_reason` (TEXT) - Причина бана
- `last_login_at` (TIMESTAMP) - Последний вход
- `created_at` (TIMESTAMP) - Дата создания
- `updated_at` (TIMESTAMP) - Дата обновления

**Индексы:**
- `idx_users_telegram_id` - По telegram_id
- `idx_users_username` - По username (частичный, где не NULL)
- `idx_users_is_active` - По is_active
- `idx_users_created_at` - По created_at

#### roles
Роли пользователей.

**Поля:**
- `id` (UUID, PK)
- `name` (VARCHAR(50), UNIQUE, NOT NULL) - Название роли
- `description` (TEXT) - Описание
- `is_system` (BOOLEAN, DEFAULT false) - Системная роль
- `created_at`, `updated_at` (TIMESTAMP)

**Индексы:**
- `idx_roles_name` - По name

#### permissions
Разрешения.

**Поля:**
- `id` (UUID, PK)
- `name` (VARCHAR(100), UNIQUE, NOT NULL) - Название разрешения
- `description` (TEXT) - Описание
- `resource` (VARCHAR(100)) - Ресурс
- `action` (VARCHAR(50)) - Действие
- `created_at` (TIMESTAMP)

**Индексы:**
- `idx_permissions_name` - По name
- `idx_permissions_resource` - По resource

#### role_permissions
Связь ролей и разрешений (Many-to-Many).

**Поля:**
- `role_id` (UUID, FK → roles.id)
- `permission_id` (UUID, FK → permissions.id)
- PRIMARY KEY (role_id, permission_id)

#### user_roles
Связь пользователей и ролей (Many-to-Many).

**Поля:**
- `user_id` (UUID, FK → users.id)
- `role_id` (UUID, FK → roles.id)
- `assigned_at` (TIMESTAMP)
- `assigned_by` (UUID, FK → users.id)
- PRIMARY KEY (user_id, role_id)

### 2. Wallets & Balances

#### wallets
Кошельки пользователей.

**Поля:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, NOT NULL)
- `type` (VARCHAR(50), NOT NULL) - Тип кошелька
- `address` (VARCHAR(255)) - Адрес кошелька
- `is_active` (BOOLEAN, DEFAULT true)
- `is_verified` (BOOLEAN, DEFAULT false)
- `metadata` (JSONB) - Дополнительные данные
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_wallet_type` - type IN ('telegram_wallet', 'ton_wallet', 'internal')

**Индексы:**
- `idx_wallets_user` - По user_id
- `idx_wallets_type` - По type
- `idx_wallets_address` - По address (частичный)
- `idx_wallets_user_type` - UNIQUE по (user_id, type) где is_active = true

#### balances
Балансы кошельков.

**Поля:**
- `id` (UUID, PK)
- `wallet_id` (UUID, FK → wallets.id, NOT NULL)
- `currency` (VARCHAR(10), DEFAULT 'TON') - Валюта
- `amount` (DECIMAL(20, 8), DEFAULT 0) - Общая сумма
- `locked_amount` (DECIMAL(20, 8), DEFAULT 0) - Заблокированная сумма
- `available_amount` (DECIMAL(20, 8), GENERATED) - Доступная сумма (amount - locked_amount)
- `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_balance_amount` - amount >= 0
- `chk_balance_locked` - locked_amount >= 0
- `chk_balance_available` - available_amount >= 0

**Индексы:**
- `idx_balances_wallet_currency` - UNIQUE по (wallet_id, currency)
- `idx_balances_wallet` - По wallet_id
- `idx_balances_currency` - По currency

### 3. Markets & Outcomes

#### categories
Категории рынков.

**Поля:**
- `id` (UUID, PK)
- `name` (VARCHAR(255), NOT NULL) - Название
- `slug` (VARCHAR(255), UNIQUE, NOT NULL) - URL-слаг
- `description` (TEXT) - Описание
- `icon_url` (TEXT) - URL иконки
- `parent_id` (UUID, FK → categories.id) - Родительская категория
- `sort_order` (INTEGER, DEFAULT 0) - Порядок сортировки
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at` (TIMESTAMP)

**Индексы:**
- `idx_categories_slug` - По slug
- `idx_categories_parent` - По parent_id
- `idx_categories_active` - По is_active

#### markets
Рынки прогнозов.

**Поля:**
- `id` (UUID, PK)
- `title` (VARCHAR(500), NOT NULL) - Название
- `slug` (VARCHAR(500), UNIQUE, NOT NULL) - URL-слаг
- `description` (TEXT, NOT NULL) - Описание
- `category_id` (UUID, FK → categories.id) - Категория
- `status` (VARCHAR(50), DEFAULT 'draft') - Статус
- `type` (VARCHAR(50), DEFAULT 'binary') - Тип (binary/multi)
- `pricing_model` (VARCHAR(50), DEFAULT 'lmsr') - Модель ценообразования
- `liquidity` (DECIMAL(20, 8), DEFAULT 0) - Ликвидность
- `total_volume` (DECIMAL(20, 8), DEFAULT 0) - Общий объем
- `total_bets` (INTEGER, DEFAULT 0) - Количество ставок
- `resolved_outcome_id` (UUID) - ID разрешенного исхода
- `resolution_date` (TIMESTAMP) - Дата разрешения
- `end_date` (TIMESTAMP) - Дата окончания
- `image_url` (TEXT) - URL изображения
- `telegram_channel_id` (VARCHAR(255)) - ID Telegram канала
- `telegram_message_id` (VARCHAR(255)) - ID сообщения в Telegram
- `created_by` (UUID, FK → users.id, NOT NULL) - Создатель
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_market_status` - status IN ('draft', 'open', 'closed', 'resolved', 'cancelled')
- `chk_market_type` - type IN ('binary', 'multi')
- `chk_market_pricing` - pricing_model IN ('lmsr', 'constant_product')
- `chk_market_liquidity` - liquidity >= 0
- `chk_market_volume` - total_volume >= 0

**Индексы:**
- `idx_markets_slug` - По slug
- `idx_markets_category` - По category_id
- `idx_markets_status` - По status
- `idx_markets_created_by` - По created_by
- `idx_markets_created_at` - По created_at
- `idx_markets_end_date` - По end_date
- `idx_markets_resolution_date` - По resolution_date
- `idx_markets_telegram_channel` - По telegram_channel_id (частичный)

#### outcomes
Исходы рынков.

**Поля:**
- `id` (UUID, PK)
- `market_id` (UUID, FK → markets.id, NOT NULL)
- `title` (VARCHAR(255), NOT NULL) - Название
- `description` (TEXT) - Описание
- `probability` (DECIMAL(10, 8), DEFAULT 0.5) - Вероятность
- `shares` (DECIMAL(20, 8), DEFAULT 0) - Количество акций
- `total_volume` (DECIMAL(20, 8), DEFAULT 0) - Общий объем
- `is_resolved` (BOOLEAN, DEFAULT false) - Разрешен ли
- `sort_order` (INTEGER, DEFAULT 0) - Порядок сортировки
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_outcome_probability` - probability BETWEEN 0 AND 1
- `chk_outcome_shares` - shares >= 0
- `chk_outcome_volume` - total_volume >= 0

**Индексы:**
- `idx_outcomes_market` - По market_id
- `idx_outcomes_resolved` - По is_resolved
- `idx_outcomes_market_resolved` - По (market_id, is_resolved)

#### liquidity_pools
Пул ликвидности.

**Поля:**
- `id` (UUID, PK)
- `market_id` (UUID, FK → markets.id, NOT NULL)
- `outcome_id` (UUID, FK → outcomes.id) - Исход (опционально)
- `provider_id` (UUID, FK → users.id, NOT NULL) - Провайдер ликвидности
- `amount` (DECIMAL(20, 8), NOT NULL) - Сумма
- `fee_rate` (DECIMAL(10, 8), DEFAULT 0) - Комиссия
- `total_fees_earned` (DECIMAL(20, 8), DEFAULT 0) - Заработанные комиссии
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_pool_amount` - amount > 0
- `chk_pool_fee_rate` - fee_rate BETWEEN 0 AND 1

**Индексы:**
- `idx_liquidity_pools_market` - По market_id
- `idx_liquidity_pools_outcome` - По outcome_id
- `idx_liquidity_pools_provider` - По provider_id
- `idx_liquidity_pools_active` - По is_active

### 4. Bets & Transactions

#### bets
Ставки пользователей.

**Поля:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, NOT NULL)
- `market_id` (UUID, FK → markets.id, NOT NULL)
- `outcome_id` (UUID, FK → outcomes.id, NOT NULL)
- `wallet_id` (UUID, FK → wallets.id, NOT NULL)
- `type` (VARCHAR(50), NOT NULL) - Тип (buy/sell)
- `shares` (DECIMAL(20, 8), NOT NULL) - Количество акций
- `price` (DECIMAL(20, 8), NOT NULL) - Цена
- `total_cost` (DECIMAL(20, 8), NOT NULL) - Общая стоимость
- `potential_payout` (DECIMAL(20, 8)) - Потенциальный выигрыш
- `status` (VARCHAR(50), DEFAULT 'pending') - Статус
- `referral_code` (VARCHAR(255)) - Реферальный код
- `created_at`, `updated_at` (TIMESTAMP)
- `resolved_at` (TIMESTAMP) - Дата разрешения

**Ограничения:**
- `chk_bet_type` - type IN ('buy', 'sell')
- `chk_bet_shares` - shares > 0
- `chk_bet_price` - price > 0
- `chk_bet_cost` - total_cost > 0
- `chk_bet_status` - status IN ('pending', 'active', 'won', 'lost', 'cancelled', 'refunded')

**Индексы:**
- `idx_bets_user` - По user_id
- `idx_bets_market` - По market_id
- `idx_bets_outcome` - По outcome_id
- `idx_bets_wallet` - По wallet_id
- `idx_bets_status` - По status
- `idx_bets_created_at` - По created_at
- `idx_bets_user_market` - По (user_id, market_id)
- `idx_bets_market_status` - По (market_id, status)

#### transactions
Транзакции.

**Поля:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, NOT NULL)
- `wallet_id` (UUID, FK → wallets.id, NOT NULL)
- `bet_id` (UUID, FK → bets.id) - Связанная ставка
- `type` (VARCHAR(50), NOT NULL) - Тип транзакции
- `status` (VARCHAR(50), DEFAULT 'pending') - Статус
- `amount` (DECIMAL(20, 8), NOT NULL) - Сумма
- `currency` (VARCHAR(10), DEFAULT 'TON') - Валюта
- `fee` (DECIMAL(20, 8), DEFAULT 0) - Комиссия
- `net_amount` (DECIMAL(20, 8), GENERATED) - Чистая сумма (amount - fee)
- `external_transaction_id` (VARCHAR(255)) - Внешний ID транзакции
- `metadata` (JSONB) - Дополнительные данные
- `error_message` (TEXT) - Сообщение об ошибке
- `processed_at` (TIMESTAMP) - Дата обработки
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_transaction_type` - type IN (deposit, withdrawal, bet_placed, bet_won, bet_lost, refund, commission, referral_bonus, admin_adjustment)
- `chk_transaction_status` - status IN ('pending', 'completed', 'failed', 'cancelled')
- `chk_transaction_amount` - amount > 0
- `chk_transaction_fee` - fee >= 0

**Индексы:**
- `idx_transactions_user` - По user_id
- `idx_transactions_wallet` - По wallet_id
- `idx_transactions_bet` - По bet_id
- `idx_transactions_type` - По type
- `idx_transactions_status` - По status
- `idx_transactions_created_at` - По created_at
- `idx_transactions_external_id` - По external_transaction_id (частичный)
- `idx_transactions_user_type` - По (user_id, type)
- `idx_transactions_user_status` - По (user_id, status)

#### payouts
Выплаты.

**Поля:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, NOT NULL)
- `bet_id` (UUID, FK → bets.id, NOT NULL)
- `wallet_id` (UUID, FK → wallets.id, NOT NULL)
- `amount` (DECIMAL(20, 8), NOT NULL) - Сумма
- `currency` (VARCHAR(10), DEFAULT 'TON') - Валюта
- `status` (VARCHAR(50), DEFAULT 'pending') - Статус
- `transaction_id` (UUID, FK → transactions.id) - Связанная транзакция
- `external_payout_id` (VARCHAR(255)) - Внешний ID выплаты
- `processed_at` (TIMESTAMP) - Дата обработки
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_payout_amount` - amount > 0
- `chk_payout_status` - status IN ('pending', 'processing', 'completed', 'failed')

**Индексы:**
- `idx_payouts_user` - По user_id
- `idx_payouts_bet` - По bet_id
- `idx_payouts_wallet` - По wallet_id
- `idx_payouts_status` - По status
- `idx_payouts_transaction` - По transaction_id
- `idx_payouts_created_at` - По created_at

### 5. Telegram Integration

#### telegram_channels
Telegram каналы.

**Поля:**
- `id` (UUID, PK)
- `channel_id` (VARCHAR(255), UNIQUE, NOT NULL) - ID канала
- `channel_username` (VARCHAR(255)) - Username канала
- `channel_title` (VARCHAR(255)) - Название
- `channel_type` (VARCHAR(50)) - Тип канала
- `is_active` (BOOLEAN, DEFAULT true)
- `is_verified` (BOOLEAN, DEFAULT false)
- `subscriber_count` (INTEGER, DEFAULT 0) - Количество подписчиков
- `settings` (JSONB) - Настройки
- `created_at`, `updated_at` (TIMESTAMP)

**Индексы:**
- `idx_telegram_channels_channel_id` - По channel_id
- `idx_telegram_channels_username` - По channel_username (частичный)
- `idx_telegram_channels_active` - По is_active

#### posts
Посты в каналах.

**Поля:**
- `id` (UUID, PK)
- `channel_id` (UUID, FK → telegram_channels.id)
- `template_id` (UUID) - ID шаблона
- `market_id` (UUID, FK → markets.id) - Связанный рынок
- `title` (VARCHAR(500)) - Заголовок
- `content` (TEXT, NOT NULL) - Содержание
- `status` (VARCHAR(50), DEFAULT 'draft') - Статус
- `scheduled_at` (TIMESTAMP) - Запланированная дата
- `published_at` (TIMESTAMP) - Дата публикации
- `telegram_message_id` (VARCHAR(255)) - ID сообщения в Telegram
- `views_count` (INTEGER, DEFAULT 0) - Просмотры
- `clicks_count` (INTEGER, DEFAULT 0) - Клики
- `created_by` (UUID, FK → users.id, NOT NULL)
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_post_status` - status IN ('draft', 'scheduled', 'published', 'archived')

**Индексы:**
- `idx_posts_channel` - По channel_id
- `idx_posts_template` - По template_id
- `idx_posts_market` - По market_id
- `idx_posts_status` - По status
- `idx_posts_scheduled` - По scheduled_at (частичный)
- `idx_posts_published` - По published_at (частичный)
- `idx_posts_created_by` - По created_by

#### post_templates
Шаблоны постов.

**Поля:**
- `id` (UUID, PK)
- `name` (VARCHAR(255), NOT NULL) - Название
- `description` (TEXT) - Описание
- `content` (TEXT, NOT NULL) - Содержание
- `variables` (JSONB) - Переменные
- `is_active` (BOOLEAN, DEFAULT true)
- `created_by` (UUID, FK → users.id, NOT NULL)
- `created_at`, `updated_at` (TIMESTAMP)

**Индексы:**
- `idx_post_templates_name` - По name
- `idx_post_templates_active` - По is_active
- `idx_post_templates_created_by` - По created_by

### 6. Referral System

#### referral_links
Реферальные ссылки.

**Поля:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id, NOT NULL)
- `code` (VARCHAR(255), UNIQUE, NOT NULL) - Код
- `name` (VARCHAR(255)) - Название
- `description` (TEXT) - Описание
- `is_active` (BOOLEAN, DEFAULT true)
- `max_uses` (INTEGER) - Максимум использований
- `current_uses` (INTEGER, DEFAULT 0) - Текущее количество использований
- `bonus_rate` (DECIMAL(10, 8), DEFAULT 0) - Процент бонуса
- `expires_at` (TIMESTAMP) - Дата истечения
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_referral_uses` - current_uses >= 0
- `chk_referral_bonus` - bonus_rate BETWEEN 0 AND 1

**Индексы:**
- `idx_referral_links_code` - UNIQUE по code
- `idx_referral_links_user` - По user_id
- `idx_referral_links_active` - По is_active

#### user_referrals
Отслеживание рефералов.

**Поля:**
- `id` (UUID, PK)
- `referrer_id` (UUID, FK → users.id, NOT NULL) - Реферер
- `referred_id` (UUID, FK → users.id, NOT NULL, UNIQUE) - Реферал
- `referral_link_id` (UUID, FK → referral_links.id) - Использованная ссылка
- `first_bet_id` (UUID, FK → bets.id) - Первая ставка
- `total_earned` (DECIMAL(20, 8), DEFAULT 0) - Всего заработано
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_referral_earned` - total_earned >= 0
- `uq_referral_referred` - UNIQUE по referred_id

**Индексы:**
- `idx_user_referrals_referrer` - По referrer_id
- `idx_user_referrals_referred` - По referred_id
- `idx_user_referrals_link` - По referral_link_id
- `idx_user_referrals_active` - По is_active

### 7. Analytics & Tracking

#### traffic_sources
Источники трафика.

**Поля:**
- `id` (UUID, PK)
- `name` (VARCHAR(255), NOT NULL) - Название
- `type` (VARCHAR(50), NOT NULL) - Тип
- `code` (VARCHAR(255), UNIQUE) - Код
- `is_active` (BOOLEAN, DEFAULT true)
- `metadata` (JSONB) - Дополнительные данные
- `created_at`, `updated_at` (TIMESTAMP)

**Ограничения:**
- `chk_traffic_type` - type IN ('direct', 'referral', 'telegram', 'social', 'paid')

**Индексы:**
- `idx_traffic_sources_code` - По code
- `idx_traffic_sources_type` - По type
- `idx_traffic_sources_active` - По is_active

#### analytics_events
События аналитики.

**Поля:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id) - Пользователь
- `market_id` (UUID, FK → markets.id) - Рынок
- `bet_id` (UUID, FK → bets.id) - Ставка
- `event_type` (VARCHAR(100), NOT NULL) - Тип события
- `metadata` (JSONB) - Дополнительные данные
- `ip_address` (VARCHAR(45)) - IP адрес
- `user_agent` (TEXT) - User Agent
- `referrer` (TEXT) - Реферер
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` (VARCHAR(255)) - UTM метки
- `referral_code` (VARCHAR(255)) - Реферальный код
- `traffic_source_id` (UUID, FK → traffic_sources.id) - Источник трафика
- `session_id` (VARCHAR(255)) - ID сессии
- `created_at` (TIMESTAMP)

**Индексы:**
- `idx_analytics_events_user` - По user_id
- `idx_analytics_events_market` - По market_id
- `idx_analytics_events_bet` - По bet_id
- `idx_analytics_events_type` - По event_type
- `idx_analytics_events_created_at` - По created_at
- `idx_analytics_events_session` - По session_id (частичный)
- `idx_analytics_events_referral` - По referral_code (частичный)
- `idx_analytics_events_traffic_source` - По traffic_source_id
- `idx_analytics_events_user_type` - По (user_id, event_type)
- `idx_analytics_events_created_at_type` - По (created_at, event_type)

### 8. Admin & Audit

#### admin_audit_logs
Логи аудита администраторов.

**Поля:**
- `id` (UUID, PK)
- `admin_id` (UUID, FK → users.id, NOT NULL) - Администратор
- `action` (VARCHAR(100), NOT NULL) - Действие
- `resource_type` (VARCHAR(100)) - Тип ресурса
- `resource_id` (UUID) - ID ресурса
- `old_values` (JSONB) - Старые значения
- `new_values` (JSONB) - Новые значения
- `ip_address` (VARCHAR(45)) - IP адрес
- `user_agent` (TEXT) - User Agent
- `created_at` (TIMESTAMP)

**Индексы:**
- `idx_audit_logs_admin` - По admin_id
- `idx_audit_logs_action` - По action
- `idx_audit_logs_resource` - По (resource_type, resource_id)
- `idx_audit_logs_created_at` - По created_at
- `idx_audit_logs_admin_action` - По (admin_id, action)

## Триггеры

Автоматическое обновление `updated_at` для всех таблиц с этим полем через функцию `update_updated_at_column()`.

## Начальные данные

- Роли: user, admin, moderator, analyst
- Разрешения для всех действий
- Категории рынков: Политика, Спорт, Криптовалюты, Экономика, Технологии, Развлечения, Другое

