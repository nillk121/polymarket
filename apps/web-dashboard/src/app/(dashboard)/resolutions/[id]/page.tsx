'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resolutionApi } from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState } from 'react';

export default function ResolutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resolutionId = params.id as string;
  const queryClient = useQueryClient();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeData, setDisputeData] = useState({
    disputedOutcomeId: '',
    reason: '',
    evidence: {},
  });

  const { data: resolution, isLoading } = useQuery({
    queryKey: ['resolution', resolutionId],
    queryFn: () => resolutionApi.getOne(resolutionId).then((res) => res.data),
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['resolution-audit-logs', resolutionId],
    queryFn: () =>
      resolutionApi.getAuditLogs(resolutionId).then((res) => res.data),
  });

  const confirmMutation = useMutation({
    mutationFn: () => resolutionApi.confirm(resolutionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolution', resolutionId] });
      queryClient.invalidateQueries({ queryKey: ['resolutions'] });
    },
  });

  const createDisputeMutation = useMutation({
    mutationFn: (data: any) =>
      resolutionApi.createDispute(resolutionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolution', resolutionId] });
      setShowDisputeForm(false);
      setDisputeData({ disputedOutcomeId: '', reason: '', evidence: {} });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (!resolution) {
    return <div className="text-center py-8">Разрешение не найдено</div>;
  }

  const disputeWindowOpen =
    resolution.disputeWindowEnds &&
    new Date(resolution.disputeWindowEnds) > new Date();
  const openDisputes =
    resolution.disputes?.filter((d: any) => d.status === 'open') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Разрешение рынка
          </h1>
          <p className="mt-2 text-gray-600">{resolution.market?.title}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Назад
        </button>
      </div>

      {/* Основная информация */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Основная информация</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-gray-500">Рынок</div>
            <div className="font-medium">{resolution.market?.title}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Разрешенный исход</div>
            <div className="font-medium">
              {resolution.resolvedOutcome?.title}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Источник</div>
            <div className="font-medium">
              {resolution.resolutionSource === 'oracle'
                ? `Оракул: ${resolution.oracle?.name || 'Неизвестно'}`
                : `Админ: ${resolution.resolver?.username || 'Неизвестно'}`}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Статус</div>
            <div className="font-medium">{resolution.status}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Дата разрешения</div>
            <div className="font-medium">
              {format(
                new Date(resolution.resolutionDate),
                'dd.MM.yyyy HH:mm',
                { locale: ru },
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Окно споров</div>
            <div className="font-medium">
              {disputeWindowOpen ? (
                <span className="text-green-600">Открыто до{' '}
                  {format(
                    new Date(resolution.disputeWindowEnds!),
                    'dd.MM.yyyy HH:mm',
                    { locale: ru },
                  )}
                </span>
              ) : (
                <span className="text-gray-500">Закрыто</span>
              )}
            </div>
          </div>
        </div>
        {resolution.resolutionNotes && (
          <div className="mt-4">
            <div className="text-sm text-gray-500">Примечания</div>
            <div className="mt-1">{resolution.resolutionNotes}</div>
          </div>
        )}
      </div>

      {/* Споры */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Споры ({resolution.disputes?.length || 0})
          </h2>
          {disputeWindowOpen && (
            <button
              onClick={() => setShowDisputeForm(!showDisputeForm)}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              {showDisputeForm ? 'Отмена' : 'Создать спор'}
            </button>
          )}
        </div>

        {showDisputeForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createDisputeMutation.mutate(disputeData);
            }}
            className="mb-6 rounded-lg border p-4"
          >
            <h3 className="mb-4 font-semibold">Новый спор</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Альтернативный исход
                </label>
                <select
                  value={disputeData.disputedOutcomeId}
                  onChange={(e) =>
                    setDisputeData({
                      ...disputeData,
                      disputedOutcomeId: e.target.value,
                    })
                  }
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                >
                  <option value="">Выберите исход</option>
                  {resolution.market?.outcomes
                    ?.filter(
                      (o: any) => o.id !== resolution.resolvedOutcomeId,
                    )
                    .map((outcome: any) => (
                      <option key={outcome.id} value={outcome.id}>
                        {outcome.title}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Причина
                </label>
                <textarea
                  value={disputeData.reason}
                  onChange={(e) =>
                    setDisputeData({ ...disputeData, reason: e.target.value })
                  }
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createDisputeMutation.isPending}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {createDisputeMutation.isPending
                    ? 'Создание...'
                    : 'Создать спор'}
                </button>
              </div>
            </div>
          </form>
        )}

        {resolution.disputes && resolution.disputes.length > 0 ? (
          <div className="space-y-4">
            {resolution.disputes.map((dispute: any) => (
              <div
                key={dispute.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      Исход: {dispute.disputedOutcome?.title}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {dispute.reason}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Создан:{' '}
                      {format(new Date(dispute.createdAt), 'dd.MM.yyyy HH:mm', {
                        locale: ru,
                      })}{' '}
                      пользователем {dispute.creator?.username || 'Неизвестно'}
                    </div>
                    {dispute.status !== 'open' && (
                      <div className="mt-2">
                        <div className="text-sm">
                          Статус:{' '}
                          <span
                            className={
                              dispute.status === 'accepted'
                                ? 'text-green-600'
                                : 'text-gray-600'
                            }
                          >
                            {dispute.status === 'accepted'
                              ? 'Принят'
                              : 'Отклонен'}
                          </span>
                        </div>
                        {dispute.reviewNotes && (
                          <div className="mt-1 text-sm text-gray-600">
                            {dispute.reviewNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        dispute.status === 'open'
                          ? 'bg-yellow-100 text-yellow-800'
                          : dispute.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {dispute.status === 'open'
                        ? 'Открыт'
                        : dispute.status === 'accepted'
                        ? 'Принят'
                        : 'Отклонен'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Споров нет
          </div>
        )}
      </div>

      {/* Аудит-логи */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Аудит-логи</h2>
        {auditLogs && auditLogs.length > 0 ? (
          <div className="space-y-2">
            {auditLogs.map((log: any) => (
              <div
                key={log.id}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-gray-500">
                      {log.performer?.username || 'Система'} •{' '}
                      {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', {
                        locale: ru,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Аудит-логов нет
          </div>
        )}
      </div>

      {/* Действия */}
      {resolution.status === 'pending' &&
        !disputeWindowOpen &&
        openDisputes.length === 0 && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Действия</h2>
            <button
              onClick={() => {
                if (
                  confirm(
                    'Вы уверены, что хотите подтвердить это разрешение?'
                  )
                ) {
                  confirmMutation.mutate();
                }
              }}
              disabled={confirmMutation.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {confirmMutation.isPending
                ? 'Подтверждение...'
                : 'Подтвердить разрешение'}
            </button>
          </div>
        )}
    </div>
  );
}

