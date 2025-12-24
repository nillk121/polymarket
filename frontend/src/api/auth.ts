import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authApi = {
  loginWithTelegram: async (authData: any) => {
    const response = await axios.post(`${API_URL}/auth/telegram`, authData);
    return response.data;
  },
  getMe: async (token: string) => {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

