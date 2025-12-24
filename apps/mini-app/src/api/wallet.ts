import api from '../lib/api';

export interface Wallet {
  id: string;
  userId: string;
  type: 'telegram_wallet' | 'ton_wallet' | 'internal';
  address?: string;
  isActive: boolean;
  isVerified: boolean;
  balances: Balance[];
}

export interface Balance {
  id: string;
  walletId: string;
  currency: string;
  amount: string;
  lockedAmount: string;
  availableAmount: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  netAmount: string;
  fee: string;
  createdAt: string;
}

export const walletApi = {
  getWallets: async (): Promise<Wallet[]> => {
    const response = await api.get('/users/me/wallets');
    return response.data;
  },

  getBalance: async (walletId: string, currency: string = 'TON'): Promise<Balance> => {
    const response = await api.get(`/wallets/${walletId}/balance`, {
      params: { currency },
    });
    return response.data;
  },

  getTransactions: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> => {
    const response = await api.get('/payments/transactions', { params });
    return response.data;
  },

  /**
   * Создать платеж и получить invoice URL для WebApp
   */
  createPaymentInvoice: async (data: {
    provider: string;
    amount: number;
    currency: string;
    description?: string;
  }): Promise<{ invoiceUrl: string; paymentId: string }> => {
    const response = await api.post('/payments/invoice', data);
    return response.data;
  },
};

