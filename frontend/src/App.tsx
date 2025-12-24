import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { useAuthStore } from './store/authStore';
import { MarketsPage } from './pages/MarketsPage';
import { MarketDetailPage } from './pages/MarketDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { Layout } from './components/Layout';
import './App.css';

function App() {
  const { tg, initTelegram } = useTelegram();
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initTelegram();
    if (tg?.initDataUnsafe?.user) {
      initAuth(tg.initDataUnsafe.user);
    }
  }, [tg, initTelegram, initAuth]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<MarketsPage />} />
          <Route path="/markets/:id" element={<MarketDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

