import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { safeGetInitData } from './utils/webapp';

// Screens
import MarketsList from './screens/MarketsList';
import MarketDetail from './screens/MarketDetail';
import PlaceBet from './screens/PlaceBet';
import Wallet from './screens/Wallet';
import Profile from './screens/Profile';

// Layout
import MainLayout from './components/layout/MainLayout';

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    // Initialize Telegram authentication safely
    const initData = safeGetInitData();
    if (initData) {
      console.log('✅ initData получен, запускаем авторизацию...');
      initAuth(initData).catch((error) => {
        console.error('❌ Ошибка авторизации:', error);
        // Не закрываем приложение при ошибке авторизации в dev режиме
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Продолжаем работу без авторизации (dev режим)');
          console.warn('💡 Приложение будет работать в режиме без авторизации. Некоторые функции могут быть недоступны.');
        } else {
          // В production режиме можно показать сообщение пользователю
          console.error('❌ Критическая ошибка авторизации. Приложение может работать некорректно.');
        }
      });
    } else {
      console.warn('⚠️ Telegram WebApp не обнаружен или initData отсутствует. Авторизация недоступна.');
      if (process.env.NODE_ENV === 'development') {
        console.warn('💡 Для тестирования в браузере используйте Telegram WebApp или установите мок initData');
      }
    }
  }, [initAuth]);

  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<MarketsList />} />
          <Route path="/markets/:id" element={<MarketDetail />} />
          <Route path="/markets/:id/bet" element={<PlaceBet />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;

