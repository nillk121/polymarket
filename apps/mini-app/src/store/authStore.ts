import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../api/auth';
import { safeWebAppClose } from '../utils/webapp';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: (initData: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      initAuth: async (initData: string) => {
        set({ isLoading: true });
        try {
          // Логирование для отладки
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Attempting Telegram auth:', {
              hasInitData: !!initData,
              initDataLength: initData?.length || 0,
              initDataPreview: initData ? initData.substring(0, 100) + '...' : 'empty',
            });
          }
          
          if (!initData || initData.trim() === '') {
            console.error('❌ initData is empty!');
            throw new Error('initData не может быть пустым. Убедитесь, что приложение запущено в Telegram.');
          }
          
          const response = await authApi.loginWithTelegram({ initData });
          // Бэкенд возвращает access_token и refresh_token, а не accessToken и refreshToken
          const accessToken = (response as any).access_token || (response as any).accessToken;
          const refreshToken = (response as any).refresh_token || (response as any).refreshToken;
          
          if (!accessToken || !refreshToken) {
            console.error('❌ Tokens not found in response:', response);
            throw new Error('Токены не получены от сервера');
          }
          
          console.log('✅ Authorization successful, tokens received');
          
          set({
            user: response.user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('❌ Auth error:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          set({ isLoading: false });
          
          // В dev режиме не закрываем приложение при ошибке авторизации
          // Пробрасываем ошибку дальше, чтобы компонент мог её обработать
          // НО не закрываем WebApp
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Продолжаем работу без авторизации (dev режим)');
          }
          
          throw error;
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        safeWebAppClose();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

