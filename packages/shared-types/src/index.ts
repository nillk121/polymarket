// Market Types
export enum MarketStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export enum MarketType {
  BINARY = 'binary',
  MULTI = 'multi',
}

export enum PricingModel {
  LMSR = 'lmsr',
  CONSTANT_PRODUCT = 'constant_product',
}

export interface Market {
  id: string;
  title: string;
  description: string;
  status: MarketStatus;
  type: MarketType;
  pricingModel: PricingModel;
  liquidity: number;
  resolvedOutcomeId?: string;
  resolutionDate?: Date;
  endDate?: Date;
  imageUrl?: string;
  telegramChannelId?: string;
  telegramMessageId?: string;
  createdById: string;
  outcomes: MarketOutcome[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketOutcome {
  id: string;
  marketId: string;
  title: string;
  probability: number;
  shares: number;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export enum OrderType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum PaymentMethod {
  TON_WALLET = 'ton_wallet',
  TELEGRAM_WALLET = 'telegram_wallet',
  TELEGRAM_STARS = 'telegram_stars',
}

export interface Order {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  type: OrderType;
  shares: number;
  price: number;
  totalCost: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentTransactionId?: string;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  balance: number;
  tonBalance: number;
  starsBalance: number;
  isAdmin: boolean;
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export enum EventType {
  MARKET_VIEW = 'market_view',
  MARKET_CREATE = 'market_create',
  ORDER_PLACE = 'order_place',
  ORDER_COMPLETE = 'order_complete',
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  PAYMENT_INIT = 'payment_init',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAIL = 'payment_fail',
  REFERRAL_CLICK = 'referral_click',
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  marketId?: string;
  eventType: EventType;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralCode?: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Telegram Types
export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// Payment Types
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Position Types
export interface UserPosition {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  shares: number;
  averagePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

