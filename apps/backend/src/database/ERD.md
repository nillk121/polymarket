# Entity Relationship Diagram

## Основные связи

```
users
  ├── user_roles ──> roles
  │     └── role_permissions ──> permissions
  ├── wallets ──> balances
  ├── bets
  ├── transactions
  ├── payouts
  ├── markets (created_by)
  ├── liquidity_pools (provider_id)
  ├── posts (created_by)
  ├── post_templates (created_by)
  ├── referral_links
  ├── user_referrals (referrer_id, referred_id)
  └── admin_audit_logs (admin_id)

markets
  ├── category_id ──> categories
  ├── created_by ──> users
  ├── outcomes
  ├── liquidity_pools
  ├── bets
  └── posts

outcomes
  ├── market_id ──> markets
  ├── bets
  └── liquidity_pools

bets
  ├── user_id ──> users
  ├── market_id ──> markets
  ├── outcome_id ──> outcomes
  ├── wallet_id ──> wallets
  ├── transactions
  ├── payouts
  └── user_referrals (first_bet_id)

transactions
  ├── user_id ──> users
  ├── wallet_id ──> wallets
  └── bet_id ──> bets

payouts
  ├── user_id ──> users
  ├── bet_id ──> bets
  ├── wallet_id ──> wallets
  └── transaction_id ──> transactions

telegram_channels
  └── posts

posts
  ├── channel_id ──> telegram_channels
  ├── template_id ──> post_templates
  ├── market_id ──> markets
  └── created_by ──> users

referral_links
  ├── user_id ──> users
  └── user_referrals

analytics_events
  ├── user_id ──> users
  ├── market_id ──> markets
  ├── bet_id ──> bets
  └── traffic_source_id ──> traffic_sources
```

## Ключевые связи Many-to-Many

1. **users ↔ roles** через `user_roles`
2. **roles ↔ permissions** через `role_permissions`

## Ключевые связи One-to-Many

1. **user → wallets** (один пользователь может иметь несколько кошельков)
2. **wallet → balances** (один кошелек может иметь балансы в разных валютах)
3. **market → outcomes** (один рынок имеет несколько исходов)
4. **market → bets** (один рынок имеет много ставок)
5. **user → bets** (один пользователь делает много ставок)
6. **category → markets** (одна категория содержит много рынков)

## Самосвязи

1. **categories → categories** (parent_id) - иерархия категорий

## Важные ограничения уникальности

1. `users.telegram_id` - UNIQUE
2. `wallets(user_id, type)` - UNIQUE где is_active = true
3. `balances(wallet_id, currency)` - UNIQUE
4. `markets.slug` - UNIQUE
5. `referral_links.code` - UNIQUE
6. `user_referrals.referred_id` - UNIQUE (один пользователь может быть рефералом только один раз)

