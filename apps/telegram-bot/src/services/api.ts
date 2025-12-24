import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3002/api';

// Логирование и проверка для отладки
if (process.env.NODE_ENV !== 'production') {
  console.log(`🔗 Telegram Bot API URL: ${API_URL}`);
  if (process.env.API_URL) {
    console.log(`   (из переменной окружения API_URL)`);
  } else {
    console.log(`   (дефолтное значение)`);
  }
  
  // Предупреждение, если используется неправильный порт
  if (API_URL.includes(':3000/api') && !API_URL.includes(':3002/api')) {
    console.warn(`⚠️  ВНИМАНИЕ: API URL указывает на порт 3000, но backend работает на порту 3002!`);
    console.warn(`   Установите API_URL=http://localhost:3002/api в apps/telegram-bot/.env`);
  }
}

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
  private fallbackUrl: string;

  constructor() {
    // Fallback на localhost, если Cloudflare Tunnel недоступен
    this.fallbackUrl = 'http://localhost:3002/api';
    
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 секунд таймаут
    });

    // Добавляем interceptor для обработки ошибок
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Если ошибка 502 и используется Cloudflare URL, пробуем localhost
        if (
          error.response?.status === 502 &&
          API_URL.includes('trycloudflare.com') &&
          !API_URL.includes('localhost')
        ) {
          console.warn('⚠️ Cloudflare Tunnel недоступен, пробуем localhost...');
          try {
            // Создаем временный клиент для localhost
            const localClient = axios.create({
              baseURL: this.fallbackUrl,
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 5000,
            });
            
            // Повторяем запрос на localhost
            const config = error.config;
            config.baseURL = this.fallbackUrl;
            const response = await localClient.request(config);
            return response;
          } catch (fallbackError) {
            console.error('❌ Fallback на localhost тоже не сработал:', fallbackError.message);
            throw error; // Возвращаем оригинальную ошибку
          }
        }
        throw error;
      }
    );
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
   * Автоматически создает пользователя и кошелек, если их нет
   */
  async getUserWallets(telegramId: string): Promise<Wallet[]> {
    // Interceptor уже обрабатывает 502 ошибки и fallback на localhost
    const response = await this.client.get(`/users/telegram/${telegramId}/wallets`);
    return response.data;
  }

  /**
   * Получить баланс пользователя
   */
  async getUserBalance(telegramId: string): Promise<Balance | null> {
    const wallets = await this.getUserWallets(telegramId);
    const internalWallet = wallets.find((w: any) => (w.type === 'internal' || w.type === 'ton') && (w.isActive !== false));
    if (!internalWallet) {
      return null;
    }
    const tonBalance = internalWallet.balances?.find((b: any) => b.currency === 'TON');
    if (!tonBalance) {
      return null;
    }
    // Простой расчет без Decimal (для бота достаточно)
    const amount = parseFloat(tonBalance.amount?.toString() || '0');
    const locked = parseFloat(tonBalance.lockedAmount?.toString() || '0');
    const available = amount - locked;
    
    return {
      currency: tonBalance.currency,
      amount: amount.toString(),
      availableAmount: available.toString(),
      lockedAmount: locked.toString(),
    };
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

  /**
   * Создать платеж для пополнения баланса через Telegram Bot
   */
  async createPayment(data: {
    provider: string;
    telegramId: string;
    amount: number;
    currency: string;
    description?: string;
  }): Promise<any> {
    // Используем публичный эндпоинт для Telegram бота
    const response = await this.client.post('/payments/telegram', {
      telegramId: data.telegramId,
      provider: data.provider,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

