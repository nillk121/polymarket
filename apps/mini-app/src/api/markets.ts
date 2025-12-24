import api from '../lib/api';

export interface Market {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: 'draft' | 'active' | 'locked' | 'resolved' | 'cancelled';
  type: 'binary' | 'multi';
  pricingModel: 'lmsr' | 'constant_product';
  liquidity: string;
  totalVolume: string;
  totalBets: number;
  resolvedOutcomeId?: string;
  resolutionDate?: string;
  endDate?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  outcomes: Outcome[];
}

export interface Outcome {
  id: string;
  name: string;
  description?: string;
  shares: string;
  totalVolume: string;
  isResolved: boolean;
  sortOrder: number;
}

export interface QueryMarketsParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  search?: string;
}

export interface MarketsResponse {
  markets: Market[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const marketsApi = {
  getMarkets: async (params?: QueryMarketsParams): Promise<MarketsResponse> => {
    const response = await api.get('/markets', { params });
    return response.data;
  },

  getMarket: async (id: string): Promise<Market> => {
    const response = await api.get(`/markets/${id}`);
    return response.data;
  },
};

