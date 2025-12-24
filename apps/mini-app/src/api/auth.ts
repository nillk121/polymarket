import api from '../lib/api';

export interface TelegramAuthData {
  initData: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export const authApi = {
  loginWithTelegram: async (data: TelegramAuthData): Promise<AuthResponse> => {
    const response = await api.post('/auth/telegram', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

