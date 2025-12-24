// Database Types and Enums

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  ANALYST = 'analyst',
}

export enum Permission {
  // Market permissions
  MARKET_CREATE = 'market:create',
  MARKET_EDIT = 'market:edit',
  MARKET_DELETE = 'market:delete',
  MARKET_RESOLVE = 'market:resolve',
  
  // User permissions
  USER_VIEW = 'user:view',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_BAN = 'user:ban',
  
  // Admin permissions
  ADMIN_VIEW = 'admin:view',
  ADMIN_EDIT = 'admin:edit',
  ADMIN_AUDIT = 'admin:audit',
  
  // Analytics permissions
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
}

export enum WalletType {
  TELEGRAM_WALLET = 'telegram_wallet',
  TON_WALLET = 'ton_wallet',
  INTERNAL = 'internal',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BET_PLACED = 'bet_placed',
  BET_WON = 'bet_won',
  BET_LOST = 'bet_lost',
  REFUND = 'refund',
  COMMISSION = 'commission',
  REFERRAL_BONUS = 'referral_bonus',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum MarketStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export enum BetStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum TrafficSourceType {
  DIRECT = 'direct',
  REFERRAL = 'referral',
  TELEGRAM = 'telegram',
  SOCIAL = 'social',
  PAID = 'paid',
}

