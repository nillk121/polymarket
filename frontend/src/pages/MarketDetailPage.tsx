import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketsApi } from '../api/markets';
import { ordersApi } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import { OrderForm } from '../components/OrderForm';
import { MarketChart } from '../components/MarketChart';
import './MarketDetailPage.css';

export function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [market, setMarket] = useState<any>(null);
  const [position, setPosition] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadMarket();
      if (token) {
        loadPosition();
      }
    }
  }, [id, token]);

  const loadMarket = async () => {
    try {
      const data = await marketsApi.getOne(id!);
      setMarket(data);
      if (data.outcomes && data.outcomes.length > 0) {
        setSelectedOutcome(data.outcomes[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки рынка:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosition = async () => {
    try {
      const data = await marketsApi.getPosition(id!);
      setPosition(data || []);
    } catch (error) {
      console.error('Ошибка загрузки позиции:', error);
    }
  };

  const handleOrder = async (orderData: any) => {
    try {
      await ordersApi.create({
        ...orderData,
        marketId: id,
      });
      await loadMarket();
      await loadPosition();
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      throw error;
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!market) {
    return <div className="error">Рынок не найден</div>;
  }

  return (
    <div className="market-detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <div className="market-detail-header">
        <h1>{market.title}</h1>
        <span className={`market-status market-status-${market.status}`}>
          {market.status === 'open' ? 'Открыт' : market.status === 'resolved' ? 'Разрешен' : 'Закрыт'}
        </span>
      </div>

      <p className="market-description">{market.description}</p>

      <div className="market-outcomes">
        <h2>Исходы</h2>
        {market.outcomes?.map((outcome: any) => (
          <div
            key={outcome.id}
            className={`outcome-item ${
              selectedOutcome === outcome.id ? 'selected' : ''
            } ${outcome.isResolved ? 'resolved' : ''}`}
            onClick={() => setSelectedOutcome(outcome.id)}
          >
            <div className="outcome-header">
              <span className="outcome-title">{outcome.title}</span>
              <span className="outcome-probability">
                {(outcome.probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="outcome-shares">
              Акций: {outcome.shares.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {market.status === 'open' && user && selectedOutcome && (
        <OrderForm
          market={market}
          selectedOutcome={selectedOutcome}
          user={user}
          onSubmit={handleOrder}
        />
      )}

      {position.length > 0 && (
        <div className="user-positions">
          <h2>Мои позиции</h2>
          {position.map((pos) => (
            <div key={pos.id} className="position-item">
              <span>{pos.outcome.title}</span>
              <span>{pos.shares.toFixed(2)} акций</span>
              <span>Средняя цена: {pos.averagePrice.toFixed(4)}</span>
            </div>
          ))}
        </div>
      )}

      <MarketChart market={market} />
    </div>
  );
}

