import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './i18n/config';
import './index.css';

// Initialize Telegram WebApp safely
import { safeWebAppReady, safeWebAppExpand } from './utils/webapp';

// Безопасная инициализация Telegram WebApp
// Добавляем обработку ошибок для предотвращения падения приложения
try {
  safeWebAppReady();
  safeWebAppExpand();
} catch (error) {
  console.warn('⚠️ Ошибка при инициализации WebApp (игнорируется):', error);
}

// Обработка глобальных ошибок WebApp SDK
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Игнорируем ошибки WebApp SDK, связанные с кэшем
    if (event.error?.message?.includes('chatId') || 
        event.error?.message?.includes('Cannot read properties of undefined')) {
      console.warn('⚠️ WebApp SDK internal error (ignored):', event.error?.message);
      event.preventDefault();
      return false;
    }
  }, true);
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);

