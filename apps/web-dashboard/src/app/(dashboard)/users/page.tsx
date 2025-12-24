'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { useState } from 'react';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    type: 'credit' as 'credit' | 'debit',
    amount: '',
    currency: 'TON',
    description: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-balances', page, search],
    queryFn: () =>
      adminApi
        .getUsersBalances({ page, limit: 20, search: search || undefined })
        .then((res) => res.data),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: any) => adminApi.adjustBalance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-balances'] });
      setShowAdjustForm(false);
      setSelectedUser(null);
      setAdjustForm({
        type: 'credit',
        amount: '',
        currency: 'TON',
        description: '',
      });
      alert('Баланс успешно изменен!');
    },
    onError: (error: any) => {
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleAdjust = () => {
    if (!selectedUser || !adjustForm.amount) {
      alert('Заполните все поля');
      return;
    }

    const wallet = selectedUser.wallets?.[0];
    if (!wallet) {
      alert('У пользователя нет активного кошелька');
      return;
    }

    adjustMutation.mutate({
      userId: selectedUser.id,
      walletId: wallet.id,
      type: adjustForm.type,
      amount: parseFloat(adjustForm.amount),
      currency: adjustForm.currency,
      description: adjustForm.description || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  const users = data?.users || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
          <p className="mt-2 text-gray-600">Управление пользователями и балансами</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Поиск по имени, username, Telegram ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Форма изменения баланса */}
      {showAdjustForm && selectedUser && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">
            {adjustForm.type === 'credit' ? 'Пополнение' : 'Списание'} баланса
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Пользователь: {selectedUser.username || selectedUser.firstName || selectedUser.telegramId}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип операции
              </label>
              <select
                value={adjustForm.type}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, type: e.target.value as 'credit' | 'debit' })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="credit">Пополнение</option>
                <option value="debit">Списание</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сумма
              </label>
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Валюта
              </label>
              <select
                value={adjustForm.currency}
                onChange={(e) => setAdjustForm({ ...adjustForm, currency: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="TON">TON</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание (необязательно)
              </label>
              <input
                type="text"
                value={adjustForm.description}
                onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Причина изменения баланса"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAdjust}
                disabled={adjustMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {adjustMutation.isPending ? 'Обработка...' : 'Применить'}
              </button>
              <button
                onClick={() => {
                  setShowAdjustForm(false);
                  setSelectedUser(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Таблица пользователей */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Telegram ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Баланс
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Заблокировано
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((user: any) => {
                const wallet = user.wallets?.[0];
                const balance = wallet?.balances?.find((b: any) => b.currency === 'TON') || {
                  amount: '0',
                  lockedAmount: '0',
                };

                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username || user.firstName || 'Без имени'}
                      </div>
                      {user.email && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.telegramId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseFloat(balance.amount || '0').toFixed(2)} TON
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parseFloat(balance.lockedAmount || '0').toFixed(2)} TON
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAdjustForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Изменить баланс
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
          >
            Назад
          </button>
          <span className="text-sm text-gray-600">
            Страница {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}

