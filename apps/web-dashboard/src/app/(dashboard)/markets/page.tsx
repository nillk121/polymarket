'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketsApi } from '@/lib/api-client';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  locked: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активен',
  locked: 'Заблокирован',
  resolved: 'Разрешен',
  cancelled: 'Отменен',
};

export default function MarketsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['markets', page],
    queryFn: () =>
      marketsApi.getAll({ page, limit: 20 }).then((res) => res.data),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => marketsApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    },
  });

  const lockMutation = useMutation({
    mutationFn: (id: string) => marketsApi.lock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => marketsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const markets = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Рынки</h1>
          <p className="mt-2 text-gray-600">Управление прогнозными рынками</p>
        </div>
        <Link
          href="/markets/new"
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Создать рынок
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Тип
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Объем
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Дата окончания
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {markets.map((market: any) => (
              <tr key={market.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {market.title}
                  </div>
                  <div className="text-sm text-gray-500">{market.slug}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {market.type === 'binary' ? 'Бинарный' : 'Множественный'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      statusColors[market.status] || statusColors.draft
                    }`}
                  >
                    {statusLabels[market.status] || market.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {market.totalVolume
                    ? `${Number(market.totalVolume).toFixed(2)} TON`
                    : '0 TON'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {market.endDate
                    ? format(new Date(market.endDate), 'dd.MM.yyyy HH:mm', {
                        locale: ru,
                      })
                    : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link
                      href={`/markets/${market.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Просмотр
                    </Link>
                    {market.status === 'draft' && (
                      <button
                        onClick={() => activateMutation.mutate(market.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Активировать
                      </button>
                    )}
                    {market.status === 'active' && (
                      <>
                        <button
                          onClick={() => lockMutation.mutate(market.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Заблокировать
                        </button>
                        <Link
                          href={`/markets/${market.id}/resolve`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Разрешить
                        </Link>
                      </>
                    )}
                    {market.status !== 'resolved' &&
                      market.status !== 'cancelled' && (
                        <button
                          onClick={() => cancelMutation.mutate(market.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Отменить
                        </button>
                      )}
                  </div>
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

