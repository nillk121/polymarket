import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const ordersApi = {
  create: async (orderData: any) => {
    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
  getUserOrders: async (page: number = 1, limit: number = 20) => {
    const response = await axios.get(`${API_URL}/orders`, {
      params: { page, limit },
      headers: getAuthHeaders(),
    });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await axios.get(`${API_URL}/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

