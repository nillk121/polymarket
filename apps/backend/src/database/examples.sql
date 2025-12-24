-- ============================================
-- Примеры использования схемы
-- ============================================

-- 1. Создание пользователя с кошельком и балансом
INSERT INTO users (telegram_id, username, first_name, is_active)
VALUES ('123456789', 'john_doe', 'John', true)
RETURNING id;

-- Создание кошелька
INSERT INTO wallets (user_id, type, is_active)
VALUES ((SELECT id FROM users WHERE telegram_id = '123456789'), 'telegram_wallet', true)
RETURNING id;

-- Создание баланса
INSERT INTO balances (wallet_id, currency, amount)
VALUES (
    (SELECT id FROM wallets WHERE user_id = (SELECT id FROM users WHERE telegram_id = '123456789')),
    'TON',
    100.0
);

-- 2. Создание рынка с исходами
INSERT INTO markets (title, slug, description, category_id, status, type, pricing_model, liquidity, created_by)
VALUES (
    'Будет ли дождь завтра?',
    'will-it-rain-tomorrow',
    'Прогноз погоды на завтра',
    (SELECT id FROM categories WHERE slug = 'other'),
    'open',
    'binary',
    'lmsr',
    1000.0,
    (SELECT id FROM users WHERE is_admin = true LIMIT 1)
)
RETURNING id;

-- Создание исходов
INSERT INTO outcomes (market_id, title, probability, shares)
VALUES
    ((SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow'), 'Да', 0.5, 0),
    ((SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow'), 'Нет', 0.5, 0);

-- 3. Размещение ставки
BEGIN;

-- Создание ставки
INSERT INTO bets (user_id, market_id, outcome_id, wallet_id, type, shares, price, total_cost, status)
VALUES (
    (SELECT id FROM users WHERE telegram_id = '123456789'),
    (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow'),
    (SELECT id FROM outcomes WHERE market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow') AND title = 'Да'),
    (SELECT id FROM wallets WHERE user_id = (SELECT id FROM users WHERE telegram_id = '123456789') AND type = 'telegram_wallet'),
    'buy',
    10.0,
    0.5,
    5.0,
    'active'
)
RETURNING id;

-- Создание транзакции
INSERT INTO transactions (user_id, wallet_id, bet_id, type, status, amount, currency, fee)
VALUES (
    (SELECT id FROM users WHERE telegram_id = '123456789'),
    (SELECT id FROM wallets WHERE user_id = (SELECT id FROM users WHERE telegram_id = '123456789') AND type = 'telegram_wallet'),
    (SELECT id FROM bets WHERE user_id = (SELECT id FROM users WHERE telegram_id = '123456789') ORDER BY created_at DESC LIMIT 1),
    'bet_placed',
    'completed',
    5.0,
    'TON',
    0.1
);

-- Обновление баланса
UPDATE balances
SET amount = amount - 5.1,
    locked_amount = locked_amount + 5.0
WHERE wallet_id = (SELECT id FROM wallets WHERE user_id = (SELECT id FROM users WHERE telegram_id = '123456789') AND type = 'telegram_wallet')
  AND currency = 'TON';

-- Обновление исхода
UPDATE outcomes
SET shares = shares + 10.0,
    total_volume = total_volume + 5.0
WHERE id = (SELECT id FROM outcomes WHERE market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow') AND title = 'Да');

COMMIT;

-- 4. Разрешение рынка и выплата
BEGIN;

-- Разрешение рынка
UPDATE markets
SET status = 'resolved',
    resolved_outcome_id = (SELECT id FROM outcomes WHERE market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow') AND title = 'Да'),
    resolution_date = CURRENT_TIMESTAMP
WHERE slug = 'will-it-rain-tomorrow';

-- Обновление исходов
UPDATE outcomes
SET is_resolved = true
WHERE market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow')
  AND id = (SELECT id FROM outcomes WHERE market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow') AND title = 'Да');

-- Обновление ставок
UPDATE bets
SET status = 'won',
    resolved_at = CURRENT_TIMESTAMP
WHERE market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow')
  AND outcome_id = (SELECT id FROM outcomes WHERE market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow') AND title = 'Да')
  AND status = 'active';

-- Создание выплат
INSERT INTO payouts (user_id, bet_id, wallet_id, amount, currency, status)
SELECT 
    b.user_id,
    b.id,
    b.wallet_id,
    b.shares * 1.0, -- Выплата по 1 TON за акцию
    'TON',
    'pending'
FROM bets b
WHERE b.market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow')
  AND b.outcome_id = (SELECT id FROM outcomes WHERE market_id = (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow') AND title = 'Да')
  AND b.status = 'won';

COMMIT;

-- 5. Аналитика - трекинг события
INSERT INTO analytics_events (user_id, market_id, event_type, ip_address, user_agent, referral_code, created_at)
VALUES (
    (SELECT id FROM users WHERE telegram_id = '123456789'),
    (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow'),
    'market_view',
    '192.168.1.1',
    'Mozilla/5.0...',
    NULL,
    CURRENT_TIMESTAMP
);

-- 6. Реферальная система
-- Создание реферальной ссылки
INSERT INTO referral_links (user_id, code, name, is_active, bonus_rate)
VALUES (
    (SELECT id FROM users WHERE telegram_id = '123456789'),
    'JOHN2024',
    'John Referral',
    true,
    0.05
);

-- Регистрация реферала
INSERT INTO user_referrals (referrer_id, referred_id, referral_link_id)
VALUES (
    (SELECT id FROM users WHERE telegram_id = '123456789'),
    (SELECT id FROM users WHERE telegram_id = '987654321'),
    (SELECT id FROM referral_links WHERE code = 'JOHN2024')
);

-- 7. Запросы для аналитики

-- Топ пользователей по объему ставок
SELECT 
    u.id,
    u.username,
    u.telegram_id,
    COUNT(b.id) as total_bets,
    SUM(b.total_cost) as total_volume
FROM users u
JOIN bets b ON u.id = b.user_id
WHERE b.status IN ('active', 'won', 'lost')
GROUP BY u.id, u.username, u.telegram_id
ORDER BY total_volume DESC
LIMIT 10;

-- Статистика по рынкам
SELECT 
    m.id,
    m.title,
    m.status,
    COUNT(DISTINCT b.id) as total_bets,
    COUNT(DISTINCT b.user_id) as unique_users,
    SUM(b.total_cost) as total_volume,
    AVG(o.probability) as avg_probability
FROM markets m
LEFT JOIN bets b ON m.id = b.market_id
LEFT JOIN outcomes o ON m.id = o.market_id
WHERE m.status = 'open'
GROUP BY m.id, m.title, m.status
ORDER BY total_volume DESC;

-- Реферальная статистика
SELECT 
    u.id,
    u.username,
    COUNT(ur.id) as total_referrals,
    SUM(ur.total_earned) as total_earned
FROM users u
LEFT JOIN user_referrals ur ON u.id = ur.referrer_id
WHERE ur.is_active = true
GROUP BY u.id, u.username
ORDER BY total_referrals DESC;

-- 8. Аудит действий администратора
INSERT INTO admin_audit_logs (admin_id, action, resource_type, resource_id, old_values, new_values, ip_address)
VALUES (
    (SELECT id FROM users WHERE is_admin = true LIMIT 1),
    'market.resolve',
    'market',
    (SELECT id FROM markets WHERE slug = 'will-it-rain-tomorrow'),
    '{"status": "open"}'::jsonb,
    '{"status": "resolved"}'::jsonb,
    '192.168.1.1'
);

