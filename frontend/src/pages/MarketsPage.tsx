import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketsApi } from '../api/markets';
import { MarketCard } from '../components/MarketCard';
import './MarketsPage.css';

interface Market {
  id: string;
  title: string;
  description: string;
  status: string;
  outcomes: Array<{
    id: string;
    title: string;
    probability: number;
  }>;
  liquidity: number;
  endDate?: string;
}

export function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadMarkets();
  }, [filter]);

  const loadMarkets = async () => {
    setLoading(true);
    try {
      const data = await marketsApi.getAll(1, 50, filter === 'all' ? undefined : filter);
      setMarkets(data.markets || []);
    } catch (error) {
      console.error('Ошибка загрузки рынков:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="markets-page">
      <header className="markets-header">
        <h1>🎯 Прогнозные рынки</h1>
        <div className="markets-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button
            className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Открытые
          </button>
          <button
            className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Разрешенные
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : markets.length === 0 ? (
        <div className="empty-state">Нет доступных рынков</div>
      ) : (
        <div className="markets-list">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onClick={() => navigate(`/markets/${market.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

