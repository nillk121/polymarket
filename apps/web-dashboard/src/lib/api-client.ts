import api from './api';

// Markets API
export const marketsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; categoryId?: string }) => {
    return api.get('/markets', { params });
  },
  getOne: (id: string) => {
    return api.get(`/markets/${id}`);
  },
  create: (data: any) => {
    return api.post('/markets', data);
  },
  update: (id: string, data: any) => {
    return api.patch(`/markets/${id}`, data);
  },
  activate: (id: string) => {
    return api.post(`/markets/${id}/activate`);
  },
  lock: (id: string) => {
    return api.post(`/markets/${id}/lock`);
  },
  resolve: (id: string, data: { resolvedOutcomeId: string; resolutionNotes?: string }) => {
    return api.post(`/markets/${id}/resolve`, data);
  },
  cancel: (id: string) => {
    return api.post(`/markets/${id}/cancel`);
  },
};

// Categories API
export const categoriesApi = {
  getAll: (params?: { includeInactive?: boolean; includeChildren?: boolean }) => {
    return api.get('/categories', { params });
  },
  getOne: (id: string) => {
    return api.get(`/categories/${id}`);
  },
  create: (data: any) => {
    return api.post('/categories', data);
  },
  update: (id: string, data: any) => {
    return api.patch(`/categories/${id}`, data);
  },
  delete: (id: string) => {
    return api.delete(`/categories/${id}`);
  },
};

// Channels API
export const channelsApi = {
  getAll: (params?: { includeInactive?: boolean }) => {
    return api.get('/channels', { params });
  },
  getOne: (id: string) => {
    return api.get(`/channels/${id}`);
  },
  create: (data: any) => {
    return api.post('/channels', data);
  },
  update: (id: string, data: any) => {
    return api.put(`/channels/${id}`, data);
  },
  delete: (id: string) => {
    return api.delete(`/channels/${id}`);
  },
};

// Posts API
export const postsApi = {
  getAll: (params?: { channelId?: string; status?: string; marketId?: string; page?: number; limit?: number }) => {
    return api.get('/posts', { params });
  },
  getOne: (id: string) => {
    return api.get(`/posts/${id}`);
  },
  create: (data: any) => {
    return api.post('/posts', data);
  },
  update: (id: string, data: any) => {
    return api.put(`/posts/${id}`, data);
  },
  publish: (id: string) => {
    return api.post(`/posts/${id}/publish`);
  },
  delete: (id: string) => {
    return api.delete(`/posts/${id}`);
  },
  getStats: (id: string) => {
    return api.get(`/posts/${id}/stats`);
  },
};

// Post Templates API
export const postTemplatesApi = {
  getAll: () => {
    return api.get('/post-templates');
  },
  getOne: (id: string) => {
    return api.get(`/post-templates/${id}`);
  },
  create: (data: any) => {
    return api.post('/post-templates', data);
  },
  update: (id: string, data: any) => {
    return api.put(`/post-templates/${id}`, data);
  },
  delete: (id: string) => {
    return api.delete(`/post-templates/${id}`);
  },
};

// Payouts API
export const payoutsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; userId?: string }) => {
    return api.get('/payouts', { params });
  },
  getOne: (id: string) => {
    return api.get(`/payouts/${id}`);
  },
  retry: (id: string) => {
    return api.post(`/payouts/${id}/retry`);
  },
  getAudit: (id: string) => {
    return api.get(`/payouts/${id}/audit`);
  },
};

// Admin API
export const adminApi = {
  getDashboard: () => {
    return api.get('/admin/dashboard');
  },
  getAuditLogs: (params?: { page?: number; limit?: number }) => {
    return api.get('/admin/audit-logs', { params });
  },
  getUsersBalances: (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/admin/users/balances', { params });
  },
  adjustBalance: (data: {
    userId: string;
    walletId: string;
    type: 'credit' | 'debit';
    amount: number;
    currency: string;
    description?: string;
  }) => {
    return api.post('/admin/balance/adjust', data);
  },
};

// Analytics API
export const analyticsApi = {
  track: (data: any) => {
    return api.post('/analytics/track', data);
  },
  getStats: () => {
    return api.get('/analytics/stats');
  },
  getTrafficSources: (params?: { startDate?: string; endDate?: string; trafficSourceId?: string }) => {
    return api.get('/analytics/traffic-sources', { params });
  },
  getBetTiming: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/analytics/bet-timing', { params });
  },
  getPopularMarkets: (params?: { startDate?: string; endDate?: string; limit?: number }) => {
    return api.get('/analytics/popular-markets', { params });
  },
  getLiquidityDepth: (marketId?: string) => {
    return api.get('/analytics/liquidity-depth', { params: { marketId } });
  },
  getUserCohorts: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/analytics/user-cohorts', { params });
  },
  getDAUMAU: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/analytics/dau-mau', { params });
  },
  getConversionFunnel: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/analytics/conversion-funnel', { params });
  },
  getDashboard: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/analytics/dashboard', { params });
  },
};

// Market Resolution API
export const resolutionApi = {
  create: (marketId: string, data: any) => {
    return api.post(`/market-resolutions/markets/${marketId}/resolve`, data);
  },
  confirm: (id: string) => {
    return api.post(`/market-resolutions/${id}/confirm`);
  },
  createDispute: (resolutionId: string, data: any) => {
    return api.post(`/market-resolutions/${resolutionId}/disputes`, data);
  },
  reviewDispute: (disputeId: string, data: any) => {
    return api.post(`/market-resolutions/disputes/${disputeId}/review`, data);
  },
  getOne: (id: string) => {
    return api.get(`/market-resolutions/${id}`);
  },
  getAll: (params?: { marketId?: string; status?: string; page?: number; limit?: number }) => {
    return api.get('/market-resolutions', { params });
  },
  getAuditLogs: (id: string) => {
    return api.get(`/market-resolutions/${id}/audit-logs`);
  },
};

// Security API
export const securityApi = {
  getEvents: (params?: { eventType?: string; severity?: string; isResolved?: boolean; page?: number; limit?: number }) => {
    return api.get('/security/events', { params });
  },
  getSuspiciousActivities: (params?: { userId?: string; isReviewed?: boolean; page?: number; limit?: number }) => {
    return api.get('/security/suspicious-activities', { params });
  },
  getMultiAccountClusters: (params?: { isConfirmed?: boolean; page?: number; limit?: number }) => {
    return api.get('/security/multi-account-clusters', { params });
  },
  freezeMarket: (marketId: string, data: { reason: string; freezeType: string; severity?: string; metadata?: any }) => {
    return api.post(`/security/markets/${marketId}/freeze`, data);
  },
  freezeAllMarkets: (data: { reason: string }) => {
    return api.post('/security/markets/freeze-all', data);
  },
  unfreezeMarket: (marketId: string, data: { unfreezeReason: string }) => {
    return api.post(`/security/markets/${marketId}/unfreeze`, data);
  },
  getActiveFreezes: (marketId?: string) => {
    return api.get('/security/market-freezes', { params: { marketId } });
  },
  analyzeUser: (userId: string, data?: { ipAddress?: string; userAgent?: string; fingerprint?: string }) => {
    return api.post(`/security/analyze-user/${userId}`, data || {});
  },
  analyzeBet: (betId: string) => {
    return api.post(`/security/analyze-bet/${betId}`);
  },
};
