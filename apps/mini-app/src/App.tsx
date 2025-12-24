import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

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
    // Initialize Telegram authentication
    const initData = WebApp.initData;
    if (initData) {
      initAuth(initData);
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

