'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () =>
      adminApi.getAuditLogs({ page, limit: 50 }).then((res) => res.data),
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const logs = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('create')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('update') || action.includes('update')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('delete') || action.includes('delete')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Аудит-логи</h1>
        <p className="mt-2 text-gray-600">
          История всех действий администраторов
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Дата и время
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Действие
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ресурс
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Детали
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.map((log: any) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {log.createdAt
                    ? format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss', {
                        locale: ru,
                      })
                    : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {log.user?.username || log.userId?.substring(0, 8) || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionColor(
                      log.action || ''
                    )}`}
                  >
                    {log.action || '-'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {log.resourceType || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="max-w-md truncate">
                    {log.details ? (
                      <pre className="whitespace-pre-wrap text-xs">
                        {typeof log.details === 'string'
                          ? log.details
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : (
                      '-'
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

