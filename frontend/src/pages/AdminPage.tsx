import { useState } from 'react';
import { marketsApi } from '../api/markets';
import { PricingModel } from '../types';
import './AdminPage.css';

export function AdminPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'binary' as 'binary' | 'multi',
    pricingModel: PricingModel.LMSR,
    liquidity: '100',
    outcomes: ['Да', 'Нет'],
    endDate: '',
  });

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await marketsApi.create({
        ...formData,
        liquidity: parseFloat(formData.liquidity),
        endDate: formData.endDate || undefined,
      });
      alert('Рынок создан успешно');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'binary',
        pricingModel: PricingModel.LMSR,
        liquidity: '100',
        outcomes: ['Да', 'Нет'],
        endDate: '',
      });
    } catch (error) {
      alert('Ошибка создания рынка');
      console.error(error);
    }
  };

  return (
    <div className="admin-page">
      <h1>Панель администратора</h1>

      <button
        className="create-button"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? 'Отмена' : '+ Создать рынок'}
      </button>

      {showCreateForm && (
        <form className="create-market-form" onSubmit={handleCreateMarket}>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Тип</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'binary' | 'multi',
                })
              }
            >
              <option value="binary">Бинарный</option>
              <option value="multi">Множественный</option>
            </select>
          </div>

          <div className="form-group">
            <label>Модель ценообразования</label>
            <select
              value={formData.pricingModel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricingModel: e.target.value as PricingModel,
                })
              }
            >
              <option value={PricingModel.LMSR}>LMSR</option>
              <option value={PricingModel.CONSTANT_PRODUCT}>
                Constant Product
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Ликвидность</label>
            <input
              type="number"
              value={formData.liquidity}
              onChange={(e) =>
                setFormData({ ...formData, liquidity: e.target.value })
              }
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Исходы (через запятую)</label>
            <input
              type="text"
              value={formData.outcomes.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  outcomes: e.target.value.split(',').map((s) => s.trim()),
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Дата окончания (необязательно)</label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />
          </div>

          <button type="submit" className="submit-button">
            Создать рынок
          </button>
        </form>
      )}
    </div>
  );
}

