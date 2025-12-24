import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

export interface Market {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  type: string;
  totalVolume: string;
  totalBets: number;
  endDate?: string;
  outcomes: Outcome[];
}

export interface Outcome {
  id: string;
  name: string;
  shares: string;
  totalVolume: string;
  isResolved: boolean;
}

export interface Wallet {
  id: string;
  type: string;
  balances: Balance[];
}

export interface Balance {
  currency: string;
  amount: string;
  availableAmount: string;
  lockedAmount: string;
}

export interface Bet {
  id: string;
  marketId: string;
  outcomeId: string;
  type: string;
  shares: string;
  totalCost: string;
  status: string;
  market?: Market;
  outcome?: Outcome;
}

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Получить список рынков
   */
  async getMarkets(params?: {
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<{ markets: Market[]; total: number }> {
    const response = await this.client.get('/markets', { params });
    return response.data;
  }

  /**
   * Получить детали рынка
   */
  async getMarket(id: string): Promise<Market> {
    const response = await this.client.get(`/markets/${id}`);
    return response.data;
  }

  /**
   * Получить кошельки пользователя
   */
  async getUserWallets(telegramId: string): Promise<Wallet[]> {
    // В реальной реализации здесь будет получение токена пользователя
    // Для демонстрации используем прямой запрос
    const response = await this.client.get(`/users/telegram/${telegramId}/wallets`);
    return response.data;
  }

  /**
   * Получить баланс пользователя
   */
  async getUserBalance(telegramId: string): Promise<Balance | null> {
    const wallets = await this.getUserWallets(telegramId);
    const internalWallet = wallets.find((w) => w.type === 'internal' && w.isActive);
    if (!internalWallet) {
      return null;
    }
    const tonBalance = internalWallet.balances.find((b) => b.currency === 'TON');
    return tonBalance || null;
  }

  /**
   * Получить ставки пользователя
   */
  async getUserBets(telegramId: string, params?: {
    status?: string;
    limit?: number;
  }): Promise<{ bets: Bet[]; total: number }> {
    const response = await this.client.get(`/users/telegram/${telegramId}/bets`, { params });
    return response.data;
  }

  /**
   * Регистрация пользователя через реферальную ссылку
   */
  async registerUserWithReferral(
    telegramId: string,
    referralCode: string,
  ): Promise<User> {
    const response = await this.client.post('/users/register', {
      telegramId,
      referralCode,
    });
    return response.data;
  }

  /**
   * Получить информацию о пользователе
   */
  async getUser(telegramId: string): Promise<User | null> {
    try {
      const response = await this.client.get(`/users/telegram/${telegramId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

export const apiClient = new ApiClient();

