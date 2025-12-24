import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../api/orders';
import './ProfilePage.css';

export function ProfilePage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getUserOrders(1, 20);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="profile-page">
      <h1>Профиль</h1>

      <div className="profile-card">
        <div className="profile-info">
          <div className="profile-name">
            {user.firstName} {user.lastName}
          </div>
          {user.username && (
            <div className="profile-username">@{user.username}</div>
          )}
        </div>

        <div className="profile-balances">
          <div className="balance-item">
            <span className="balance-label">Telegram Wallet</span>
            <span className="balance-value">{user.balance.toFixed(2)}</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">TON Wallet</span>
            <span className="balance-value">{user.tonBalance.toFixed(2)}</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">Telegram Stars</span>
            <span className="balance-value">{user.starsBalance}</span>
          </div>
        </div>

        {user.referralCode && (
          <div className="referral-section">
            <h3>Реферальный код</h3>
            <div className="referral-code">{user.referralCode}</div>
          </div>
        )}
      </div>

      <div className="orders-section">
        <h2>Мои заказы</h2>
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">Нет заказов</div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-item">
                <div className="order-header">
                  <span className="order-market">{order.market?.title}</span>
                  <span className={`order-status order-status-${order.status}`}>
                    {order.status === 'completed' ? 'Завершен' : order.status === 'pending' ? 'В обработке' : 'Отменен'}
                  </span>
                </div>
                <div className="order-details">
                  <span>{order.outcome?.title}</span>
                  <span>{order.shares} акций</span>
                  <span>{order.totalCost.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

