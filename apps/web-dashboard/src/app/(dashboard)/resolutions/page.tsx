'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resolutionApi } from '@/lib/api-client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
  final: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждено',
  disputed: 'Оспорено',
  final: 'Финальное',
};

export default function ResolutionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['resolutions', page, statusFilter],
    queryFn: () =>
      resolutionApi
        .getAll({ page, limit: 20, status: statusFilter || undefined })
        .then((res) => res.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => resolutionApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolutions'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const resolutions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Разрешения рынков</h1>
          <p className="mt-2 text-gray-600">
            Управление разрешениями и спорами
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          >
            <option value="">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="confirmed">Подтверждено</option>
            <option value="disputed">Оспорено</option>
            <option value="final">Финальное</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Рынок
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Исход
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Источник
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Окно споров
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Споры
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {resolutions.map((resolution: any) => {
              const disputeWindowOpen =
                resolution.disputeWindowEnds &&
                new Date(resolution.disputeWindowEnds) > new Date();
              const disputesCount = resolution.disputes?.length || 0;
              const openDisputes =
                resolution.disputes?.filter((d: any) => d.status === 'open')
                  .length || 0;

              return (
                <tr key={resolution.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {resolution.market?.title || 'Неизвестно'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {resolution.market?.slug || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {resolution.resolvedOutcome?.title || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {resolution.resolutionSource === 'oracle'
                      ? `Оракул: ${resolution.oracle?.name || 'Неизвестно'}`
                      : `Админ: ${resolution.resolver?.username || 'Неизвестно'}`}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        statusColors[resolution.status] || statusColors.pending
                      }`}
                    >
                      {statusLabels[resolution.status] || resolution.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {resolution.disputeWindowEnds ? (
                      <div>
                        <div
                          className={
                            disputeWindowOpen ? 'text-green-600' : 'text-gray-500'
                          }
                        >
                          {disputeWindowOpen ? 'Открыто' : 'Закрыто'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(
                            new Date(resolution.disputeWindowEnds),
                            'dd.MM.yyyy HH:mm',
                            { locale: ru },
                          )}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {disputesCount > 0 ? (
                      <div>
                        <div className="font-medium">
                          {disputesCount} всего
                        </div>
                        {openDisputes > 0 && (
                          <div className="text-red-600">
                            {openDisputes} открыто
                          </div>
                        )}
                      </div>
                    ) : (
                      'Нет'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/resolutions/${resolution.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Просмотр
                      </Link>
                      {resolution.status === 'pending' &&
                        !disputeWindowOpen &&
                        openDisputes === 0 && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  'Вы уверены, что хотите подтвердить это разрешение?'
                                )
                              ) {
                                confirmMutation.mutate(resolution.id);
                              }
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Подтвердить
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
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

