import { create } from 'zustand';
import { authApi } from '../api/auth';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  balance: number;
  tonBalance: number;
  starsBalance: number;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  initAuth: (telegramUser: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  initAuth: async (telegramUser: any) => {
    set({ isLoading: true });
    try {
      const response = await authApi.loginWithTelegram({
        id: telegramUser.id.toString(),
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        auth_date: Math.floor(Date.now() / 1000),
        hash: '', // В production должен быть реальный hash
      });
      localStorage.setItem('token', response.access_token);
      set({
        user: response.user,
        token: response.access_token,
        isLoading: false,
      });
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      set({ isLoading: false });
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

