-- ============================================
-- Polymarket Telegram - Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    banned_until TIMESTAMP,
    ban_reason TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100),
    action VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- User-Role mapping
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ============================================
-- WALLETS & BALANCES
-- ============================================

-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_wallet_type CHECK (type IN ('telegram_wallet', 'ton_wallet', 'internal'))
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_type ON wallets(type);
CREATE INDEX idx_wallets_address ON wallets(address) WHERE address IS NOT NULL;
CREATE UNIQUE INDEX idx_wallets_user_type ON wallets(user_id, type) WHERE is_active = true;

-- Balances table
CREATE TABLE balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL DEFAULT 'TON',
    amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
    locked_amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
    available_amount DECIMAL(20, 8) GENERATED ALWAYS AS (amount - locked_amount) STORED,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance_amount CHECK (amount >= 0),
    CONSTRAINT chk_balance_locked CHECK (locked_amount >= 0),
    CONSTRAINT chk_balance_available CHECK (available_amount >= 0)
);

CREATE UNIQUE INDEX idx_balances_wallet_currency ON balances(wallet_id, currency);
CREATE INDEX idx_balances_wallet ON balances(wallet_id);
CREATE INDEX idx_balances_currency ON balances(currency);

-- ============================================
-- MARKETS & OUTCOMES
-- ============================================

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Markets table
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    type VARCHAR(50) NOT NULL DEFAULT 'binary',
    pricing_model VARCHAR(50) NOT NULL DEFAULT 'lmsr',
    liquidity DECIMAL(20, 8) NOT NULL DEFAULT 0,
    total_volume DECIMAL(20, 8) NOT NULL DEFAULT 0,
    total_bets INTEGER NOT NULL DEFAULT 0,
    resolved_outcome_id UUID,
    resolution_date TIMESTAMP,
    end_date TIMESTAMP,
    image_url TEXT,
    telegram_channel_id VARCHAR(255),
    telegram_message_id VARCHAR(255),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_market_status CHECK (status IN ('draft', 'open', 'closed', 'resolved', 'cancelled')),
    CONSTRAINT chk_market_type CHECK (type IN ('binary', 'multi')),
    CONSTRAINT chk_market_pricing CHECK (pricing_model IN ('lmsr', 'constant_product')),
    CONSTRAINT chk_market_liquidity CHECK (liquidity >= 0),
    CONSTRAINT chk_market_volume CHECK (total_volume >= 0)
);

CREATE INDEX idx_markets_slug ON markets(slug);
CREATE INDEX idx_markets_category ON markets(category_id);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_created_by ON markets(created_by);
CREATE INDEX idx_markets_created_at ON markets(created_at);
CREATE INDEX idx_markets_end_date ON markets(end_date);
CREATE INDEX idx_markets_resolution_date ON markets(resolution_date);
CREATE INDEX idx_markets_telegram_channel ON markets(telegram_channel_id) WHERE telegram_channel_id IS NOT NULL;

-- Market outcomes table
CREATE TABLE outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    probability DECIMAL(10, 8) NOT NULL DEFAULT 0.5,
    shares DECIMAL(20, 8) NOT NULL DEFAULT 0,
    total_volume DECIMAL(20, 8) NOT NULL DEFAULT 0,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_outcome_probability CHECK (probability >= 0 AND probability <= 1),
    CONSTRAINT chk_outcome_shares CHECK (shares >= 0),
    CONSTRAINT chk_outcome_volume CHECK (total_volume >= 0)
);

CREATE INDEX idx_outcomes_market ON outcomes(market_id);
CREATE INDEX idx_outcomes_resolved ON outcomes(is_resolved);
CREATE INDEX idx_outcomes_market_resolved ON outcomes(market_id, is_resolved);

-- Liquidity pools table
CREATE TABLE liquidity_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id UUID REFERENCES outcomes(id) ON DELETE SET NULL,
    provider_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(20, 8) NOT NULL,
    fee_rate DECIMAL(10, 8) NOT NULL DEFAULT 0,
    total_fees_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pool_amount CHECK (amount > 0),
    CONSTRAINT chk_pool_fee_rate CHECK (fee_rate >= 0 AND fee_rate <= 1)
);

CREATE INDEX idx_liquidity_pools_market ON liquidity_pools(market_id);
CREATE INDEX idx_liquidity_pools_outcome ON liquidity_pools(outcome_id);
CREATE INDEX idx_liquidity_pools_provider ON liquidity_pools(provider_id);
CREATE INDEX idx_liquidity_pools_active ON liquidity_pools(is_active);

-- ============================================
-- BETS & TRANSACTIONS
-- ============================================

-- Bets table
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id UUID NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    type VARCHAR(50) NOT NULL,
    shares DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    total_cost DECIMAL(20, 8) NOT NULL,
    potential_payout DECIMAL(20, 8),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    referral_code VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    CONSTRAINT chk_bet_type CHECK (type IN ('buy', 'sell')),
    CONSTRAINT chk_bet_shares CHECK (shares > 0),
    CONSTRAINT chk_bet_price CHECK (price > 0),
    CONSTRAINT chk_bet_cost CHECK (total_cost > 0),
    CONSTRAINT chk_bet_status CHECK (status IN ('pending', 'active', 'won', 'lost', 'cancelled', 'refunded'))
);

CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_bets_market ON bets(market_id);
CREATE INDEX idx_bets_outcome ON bets(outcome_id);
CREATE INDEX idx_bets_wallet ON bets(wallet_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_created_at ON bets(created_at);
CREATE INDEX idx_bets_user_market ON bets(user_id, market_id);
CREATE INDEX idx_bets_market_status ON bets(market_id, status);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'TON',
    fee DECIMAL(20, 8) NOT NULL DEFAULT 0,
    net_amount DECIMAL(20, 8) GENERATED ALWAYS AS (amount - fee) STORED,
    external_transaction_id VARCHAR(255),
    metadata JSONB,
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_transaction_type CHECK (type IN ('deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'refund', 'commission', 'referral_bonus', 'admin_adjustment')),
    CONSTRAINT chk_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    CONSTRAINT chk_transaction_amount CHECK (amount > 0),
    CONSTRAINT chk_transaction_fee CHECK (fee >= 0)
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_bet ON transactions(bet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_external_id ON transactions(external_transaction_id) WHERE external_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_user_status ON transactions(user_id, status);

-- Payouts table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'TON',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    transaction_id UUID REFERENCES transactions(id),
    external_payout_id VARCHAR(255),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payout_amount CHECK (amount > 0),
    CONSTRAINT chk_payout_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_bet ON payouts(bet_id);
CREATE INDEX idx_payouts_wallet ON payouts(wallet_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_transaction ON payouts(transaction_id);
CREATE INDEX idx_payouts_created_at ON payouts(created_at);

-- ============================================
-- TELEGRAM INTEGRATION
-- ============================================

-- Telegram channels table
CREATE TABLE telegram_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    channel_username VARCHAR(255),
    channel_title VARCHAR(255),
    channel_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    subscriber_count INTEGER DEFAULT 0,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telegram_channels_channel_id ON telegram_channels(channel_id);
CREATE INDEX idx_telegram_channels_username ON telegram_channels(channel_username) WHERE channel_username IS NOT NULL;
CREATE INDEX idx_telegram_channels_active ON telegram_channels(is_active);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES telegram_channels(id) ON DELETE CASCADE,
    template_id UUID,
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    title VARCHAR(500),
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    telegram_message_id VARCHAR(255),
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_post_status CHECK (status IN ('draft', 'scheduled', 'published', 'archived'))
);

CREATE INDEX idx_posts_channel ON posts(channel_id);
CREATE INDEX idx_posts_template ON posts(template_id);
CREATE INDEX idx_posts_market ON posts(market_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_posts_published ON posts(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_posts_created_by ON posts(created_by);

-- Post templates table
CREATE TABLE post_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_templates_name ON post_templates(name);
CREATE INDEX idx_post_templates_active ON post_templates(is_active);
CREATE INDEX idx_post_templates_created_by ON post_templates(created_by);

-- ============================================
-- REFERRAL SYSTEM
-- ============================================

-- Referral links table
CREATE TABLE referral_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    bonus_rate DECIMAL(10, 8) DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_referral_uses CHECK (current_uses >= 0),
    CONSTRAINT chk_referral_bonus CHECK (bonus_rate >= 0 AND bonus_rate <= 1)
);

CREATE UNIQUE INDEX idx_referral_links_code ON referral_links(code);
CREATE INDEX idx_referral_links_user ON referral_links(user_id);
CREATE INDEX idx_referral_links_active ON referral_links(is_active);

-- User referrals tracking
CREATE TABLE user_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_link_id UUID REFERENCES referral_links(id) ON DELETE SET NULL,
    first_bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_referral_earned CHECK (total_earned >= 0),
    CONSTRAINT uq_referral_referred UNIQUE (referred_id)
);

CREATE INDEX idx_user_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX idx_user_referrals_referred ON user_referrals(referred_id);
CREATE INDEX idx_user_referrals_link ON user_referrals(referral_link_id);
CREATE INDEX idx_user_referrals_active ON user_referrals(is_active);

-- ============================================
-- ANALYTICS & TRACKING
-- ============================================

-- Traffic sources table
CREATE TABLE traffic_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    code VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_traffic_type CHECK (type IN ('direct', 'referral', 'telegram', 'social', 'paid'))
);

CREATE INDEX idx_traffic_sources_code ON traffic_sources(code);
CREATE INDEX idx_traffic_sources_type ON traffic_sources(type);
CREATE INDEX idx_traffic_sources_active ON traffic_sources(is_active);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    referral_code VARCHAR(255),
    traffic_source_id UUID REFERENCES traffic_sources(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_market ON analytics_events(market_id);
CREATE INDEX idx_analytics_events_bet ON analytics_events(bet_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_analytics_events_referral ON analytics_events(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_analytics_events_traffic_source ON analytics_events(traffic_source_id);
CREATE INDEX idx_analytics_events_user_type ON analytics_events(user_id, event_type);
CREATE INDEX idx_analytics_events_created_at_type ON analytics_events(created_at, event_type);

-- ============================================
-- ADMIN & AUDIT
-- ============================================

-- Admin audit logs table
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_audit_logs_admin_action ON admin_audit_logs(admin_id, action);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outcomes_updated_at BEFORE UPDATE ON outcomes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_liquidity_pools_updated_at BEFORE UPDATE ON liquidity_pools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_channels_updated_at BEFORE UPDATE ON telegram_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_templates_updated_at BEFORE UPDATE ON post_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_links_updated_at BEFORE UPDATE ON referral_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_referrals_updated_at BEFORE UPDATE ON user_referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traffic_sources_updated_at BEFORE UPDATE ON traffic_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description, is_system) VALUES
    ('user', 'Regular user', true),
    ('admin', 'Administrator', true),
    ('moderator', 'Moderator', true),
    ('analyst', 'Analyst', true);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('market:create', 'Create markets', 'market', 'create'),
    ('market:edit', 'Edit markets', 'market', 'edit'),
    ('market:delete', 'Delete markets', 'market', 'delete'),
    ('market:resolve', 'Resolve markets', 'market', 'resolve'),
    ('user:view', 'View users', 'user', 'view'),
    ('user:edit', 'Edit users', 'user', 'edit'),
    ('user:delete', 'Delete users', 'user', 'delete'),
    ('user:ban', 'Ban users', 'user', 'ban'),
    ('admin:view', 'View admin panel', 'admin', 'view'),
    ('admin:edit', 'Edit admin settings', 'admin', 'edit'),
    ('admin:audit', 'View audit logs', 'admin', 'audit'),
    ('analytics:view', 'View analytics', 'analytics', 'view'),
    ('analytics:export', 'Export analytics', 'analytics', 'export');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
    ('Политика', 'politics', 'Политические события и выборы'),
    ('Спорт', 'sports', 'Спортивные события'),
    ('Криптовалюты', 'crypto', 'Криптовалюты и блокчейн'),
    ('Экономика', 'economics', 'Экономические события'),
    ('Технологии', 'technology', 'Технологические новости'),
    ('Развлечения', 'entertainment', 'Развлечения и культура'),
    ('Другое', 'other', 'Прочие события');

