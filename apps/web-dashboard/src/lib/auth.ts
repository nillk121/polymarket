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
  username: string;
  email?: string;
  roles: Array<{ name: string }>;
}

export const authApi = {
  /**
   * Вход в систему (для админов)
   * 
   * ВАЖНО: В текущей версии backend нет отдельного админ-логина.
   * Для админ-панели нужно либо:
   * 1. Добавить эндпоинт POST /auth/admin/login в backend
   * 2. Использовать Telegram auth (неудобно для веб-панели)
   * 
   * Временная реализация - требует добавления админ-логина в backend
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // TODO: Добавить админ-логин в backend
    // Временная заглушка - в продакшене нужна отдельная админ-авторизация
    try {
      // Попытка использовать существующий эндпоинт (если он будет добавлен)
      const response = await api.post('/auth/admin/login', credentials);
      const data = response.data;
      
      // Сохраняем токены в cookies
      Cookies.set('accessToken', data.accessToken || data.access_token, { expires: 7 });
      Cookies.set('refreshToken', data.refreshToken || data.refresh_token, { expires: 30 });
      
      return {
        accessToken: data.accessToken || data.access_token,
        refreshToken: data.refreshToken || data.refresh_token,
        user: data.user,
      };
    } catch (error: any) {
      // Если эндпоинт не существует, выбрасываем понятную ошибку
      if (error.response?.status === 404) {
        throw new Error('Админ-логин не настроен. Обратитесь к разработчику.');
      }
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

