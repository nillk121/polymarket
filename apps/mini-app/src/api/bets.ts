import api from '../lib/api';

export interface PlaceBetDto {
  marketId: string;
  outcomeId: string;
  walletId: string;
  type: 'buy' | 'sell';
  shares?: string;
  cost?: string;
  maxSlippage?: string;
  referralCode?: string;
}

export interface Bet {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  walletId: string;
  type: 'buy' | 'sell';
  shares: string;
  price: string;
  totalCost: string;
  potentialPayout?: string;
  status: 'pending' | 'active' | 'won' | 'lost' | 'cancelled' | 'refunded';
  createdAt: string;
  resolvedAt?: string;
  market?: {
    id: string;
    title: string;
  };
  outcome?: {
    id: string;
    name: string;
  };
}

export interface QueryBetsParams {
  page?: number;
  limit?: number;
  marketId?: string;
  status?: string;
  type?: string;
}

export interface BetsResponse {
  bets: Bet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const betsApi = {
  placeBet: async (data: PlaceBetDto): Promise<Bet> => {
    const response = await api.post('/bets', data);
    return response.data;
  },

  getBets: async (params?: QueryBetsParams): Promise<BetsResponse> => {
    const response = await api.get('/bets', { params });
    return response.data;
  },

  getBet: async (id: string): Promise<Bet> => {
    const response = await api.get(`/bets/${id}`);
    return response.data;
  },
};

