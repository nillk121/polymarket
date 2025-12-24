import api from './api';
import Cookies from 'js-cookie';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email?: string;
    roles: Array<{ name: string }>;
  };
}

export interface User {
  id: string;
  telegramId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  roles: Array<{ name: string }>;
}

export const authApi = {
  /**
   * Вход в систему (для админов)
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/admin/login', credentials);
      const data = response.data;
      
      // Сохраняем токены в cookies
      const accessToken = data.accessToken || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token;
      
      if (accessToken) {
        Cookies.set('accessToken', accessToken, { expires: 7 });
      }
      if (refreshToken) {
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
      }
      
      return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: data.user,
      };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Получение текущего пользователя
   */
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Обновление токена
   */
  refreshToken: async (): Promise<{ accessToken: string }> => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await api.post('/auth/refresh', { refreshToken });
    const data = response.data;
    
    Cookies.set('accessToken', data.accessToken, { expires: 7 });
    
    return data;
  },

  /**
   * Выход из системы
   */
  logout: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  /**
   * Проверка, авторизован ли пользователь
   */
  isAuthenticated: (): boolean => {
    return !!Cookies.get('accessToken');
  },
};

