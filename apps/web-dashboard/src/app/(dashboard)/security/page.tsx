'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { securityApi } from '@/lib/api-client';

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'suspicious' | 'multi-account' | 'freezes'>('events');
  const [page, setPage] = useState(1);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['security-events', page],
    queryFn: () =>
      securityApi.getEvents({ page, limit: 20 }).then((res) => res.data),
    enabled: activeTab === 'events',
  });

  const { data: suspicious, isLoading: suspiciousLoading } = useQuery({
    queryKey: ['suspicious-activities', page],
    queryFn: () =>
      securityApi.getSuspiciousActivities({ page, limit: 20 }).then((res) => res.data),
    enabled: activeTab === 'suspicious',
  });

  const { data: clusters, isLoading: clustersLoading } = useQuery({
    queryKey: ['multi-account-clusters', page],
    queryFn: () =>
      securityApi.getMultiAccountClusters({ page, limit: 20 }).then((res) => res.data),
    enabled: activeTab === 'multi-account',
  });

  const { data: freezes, isLoading: freezesLoading } = useQuery({
    queryKey: ['market-freezes'],
    queryFn: () =>
      securityApi.getActiveFreezes().then((res) => res.data),
    enabled: activeTab === 'freezes',
  });

  const isLoading =
    (activeTab === 'events' && eventsLoading) ||
    (activeTab === 'suspicious' && suspiciousLoading) ||
    (activeTab === 'multi-account' && clustersLoading) ||
    (activeTab === 'freezes' && freezesLoading);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Безопасность</h1>
        <p className="mt-2 text-gray-600">
          Мониторинг безопасности и предотвращение злоупотреблений
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'events', label: 'События безопасности' },
            { id: 'suspicious', label: 'Подозрительная активность' },
            { id: 'multi-account', label: 'Множественные аккаунты' },
            { id: 'freezes', label: 'Заморозки рынков' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setPage(1);
              }}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <>
          {activeTab === 'events' && (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Тип события
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Серьезность
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {(events?.data || []).map((event: any) => (
                    <tr key={event.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {event.eventType}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            severityColors[event.severity] || severityColors.medium
                          }`}
                        >
                          {event.severity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {event.user?.username || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {format(new Date(event.createdAt), 'dd.MM.yyyy HH:mm', {
                          locale: ru,
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {event.isResolved ? 'Решено' : 'Открыто'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'suspicious' && (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Тип активности
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {(suspicious?.data || []).map((activity: any) => (
                    <tr key={activity.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {activity.user?.username || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {activity.activityType}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                activity.riskScore >= 90
                                  ? 'bg-red-600'
                                  : activity.riskScore >= 70
                                  ? 'bg-orange-500'
                                  : 'bg-yellow-500'
                              }`}
                              style={{
                                width: `${Math.min(100, activity.riskScore)}%`,
                              }}
                            />
                          </div>
                          <span>{activity.riskScore}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {format(new Date(activity.createdAt), 'dd.MM.yyyy HH:mm', {
                          locale: ru,
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {activity.isReviewed ? 'Просмотрено' : 'Новое'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'multi-account' && (
            <div className="space-y-4">
              {(clusters?.data || []).map((cluster: any) => (
                <div key={cluster.id} className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium">Кластер {cluster.clusterId}</div>
                      <div className="text-sm text-gray-500">
                        Уверенность: {cluster.confidence}%
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        cluster.isConfirmed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {cluster.isConfirmed ? 'Подтвержден' : 'Неподтвержден'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cluster.accounts?.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="font-medium">
                            {member.user?.username || member.userId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Telegram ID: {member.user?.telegramId || '-'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'freezes' && (
            <div className="space-y-4">
              {(freezes || []).map((freeze: any) => (
                <div key={freeze.id} className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium">
                        {freeze.market?.title || freeze.marketId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {freeze.reason}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          severityColors[freeze.severity] || severityColors.medium
                        }`}
                      >
                        {freeze.severity}
                      </span>
                      <span className="text-sm text-gray-500">
                        {freeze.freezeType}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Заморожен:{' '}
                    {format(new Date(freeze.createdAt), 'dd.MM.yyyy HH:mm', {
                      locale: ru,
                    })}{' '}
                    пользователем {freeze.freezer?.username || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

