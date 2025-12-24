'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsApi } from '@/lib/api-client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  processing: 'Обрабатывается',
  completed: 'Завершена',
  failed: 'Ошибка',
};

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['payouts', page, statusFilter],
    queryFn: () =>
      payoutsApi
        .getAll({ page, limit: 20, status: statusFilter || undefined })
        .then((res) => res.data),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => payoutsApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const payouts = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Выплаты</h1>
          <p className="mt-2 text-gray-600">Управление выплатами пользователям</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          >
            <option value="">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="processing">Обрабатывается</option>
            <option value="completed">Завершена</option>
            <option value="failed">Ошибка</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Сумма
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Метод
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Дата создания
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {payouts.map((payout: any) => (
              <tr key={payout.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {payout.id.substring(0, 8)}...
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {payout.user?.username || payout.userId?.substring(0, 8) || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {Number(payout.amount).toFixed(2)} {payout.currency || 'TON'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {payout.method === 'ton' ? 'TON Wallet' : 
                   payout.method === 'telegram_wallet' ? 'Telegram Wallet' :
                   payout.method || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      statusColors[payout.status] || statusColors.pending
                    }`}
                  >
                    {statusLabels[payout.status] || payout.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {payout.createdAt
                    ? format(new Date(payout.createdAt), 'dd.MM.yyyy HH:mm', {
                        locale: ru,
                      })
                    : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {payout.status === 'failed' && (
                    <button
                      onClick={() => retryMutation.mutate(payout.id)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Повторить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Назад
          </button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-700">
            Страница {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}

