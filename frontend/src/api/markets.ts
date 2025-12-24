import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const marketsApi = {
  getAll: async (page: number = 1, limit: number = 20, status?: string) => {
    const response = await axios.get(`${API_URL}/markets`, {
      params: { page, limit, status },
    });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await axios.get(`${API_URL}/markets/${id}`);
    return response.data;
  },
  getStats: async (id: string) => {
    const response = await axios.get(`${API_URL}/markets/${id}/stats`);
    return response.data;
  },
  getPosition: async (id: string) => {
    const response = await axios.get(`${API_URL}/markets/${id}/position`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
  create: async (marketData: any) => {
    const response = await axios.post(`${API_URL}/markets`, marketData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
  resolve: async (marketId: string, outcomeId: string) => {
    const response = await axios.post(
      `${API_URL}/markets/${marketId}/resolve`,
      { outcomeId },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },
};
