import { useState } from 'react';
import { OrderType, PaymentMethod } from '../types';
import './OrderForm.css';

interface OrderFormProps {
  market: any;
  selectedOutcome: string;
  user: any;
  onSubmit: (orderData: any) => Promise<void>;
}

export function OrderForm({
  market,
  selectedOutcome,
  user,
  onSubmit,
}: OrderFormProps) {
  const [shares, setShares] = useState<string>('1');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.TELEGRAM_WALLET,
  );
  const [loading, setLoading] = useState(false);

  const outcome = market.outcomes.find((o: any) => o.id === selectedOutcome);
  const estimatedCost = parseFloat(shares) * (outcome?.probability || 0.5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        outcomeId: selectedOutcome,
        type: OrderType.BUY,
        shares: parseFloat(shares),
        paymentMethod,
      });
      setShares('1');
    } catch (error) {
      alert('Ошибка создания заказа');
    } finally {
      setLoading(false);
    }
  };

  const getBalance = () => {
    switch (paymentMethod) {
      case PaymentMethod.TON_WALLET:
        return user.tonBalance;
      case PaymentMethod.TELEGRAM_STARS:
        return user.starsBalance;
      default:
        return user.balance;
    }
  };

  return (
    <form className="order-form" onSubmit={handleSubmit}>
      <h3>Купить акции</h3>

      <div className="form-group">
        <label>Исход</label>
        <div className="outcome-display">
          {outcome?.title} ({(outcome?.probability * 100).toFixed(1)}%)
        </div>
      </div>

      <div className="form-group">
        <label>Количество акций</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Метод оплаты</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        >
          <option value={PaymentMethod.TELEGRAM_WALLET}>
            Telegram Wallet ({user.balance.toFixed(2)})
          </option>
          <option value={PaymentMethod.TON_WALLET}>
            TON Wallet ({user.tonBalance.toFixed(2)})
          </option>
          <option value={PaymentMethod.TELEGRAM_STARS}>
            Telegram Stars ({user.starsBalance})
          </option>
        </select>
      </div>

      <div className="order-summary">
        <div className="summary-row">
          <span>Примерная стоимость:</span>
          <span className="summary-value">{estimatedCost.toFixed(4)}</span>
        </div>
        <div className="summary-row">
          <span>Доступно:</span>
          <span className="summary-value">{getBalance().toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        className="submit-button"
        disabled={loading || estimatedCost > getBalance()}
      >
        {loading ? 'Обработка...' : 'Купить'}
      </button>
    </form>
  );
}

