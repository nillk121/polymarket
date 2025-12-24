'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelsApi } from '@/lib/api-client';
import { useState } from 'react';

export default function ChannelsPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    channelId: '',
    channelUsername: '',
    channelTitle: '',
    channelType: 'channel',
    settings: {},
  });

  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: () =>
      channelsApi.getAll({ includeInactive: true }).then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => channelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setShowCreateForm(false);
      setFormData({
        channelId: '',
        channelUsername: '',
        channelTitle: '',
        channelType: 'channel',
        settings: {},
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => channelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Каналы</h1>
          <p className="mt-2 text-gray-600">Управление Telegram каналами</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {showCreateForm ? 'Отмена' : 'Подключить канал'}
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-white p-6 shadow"
        >
          <h2 className="mb-4 text-lg font-semibold">Подключить канал</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ID канала *
              </label>
              <input
                type="text"
                required
                value={formData.channelId}
                onChange={(e) =>
                  setFormData({ ...formData, channelId: e.target.value })
                }
                placeholder="-1001234567890"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username канала
              </label>
              <input
                type="text"
                value={formData.channelUsername}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    channelUsername: e.target.value,
                  })
                }
                placeholder="@my_channel"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Название канала
              </label>
              <input
                type="text"
                value={formData.channelTitle}
                onChange={(e) =>
                  setFormData({ ...formData, channelTitle: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Тип канала
              </label>
              <select
                value={formData.channelType}
                onChange={(e) =>
                  setFormData({ ...formData, channelType: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              >
                <option value="channel">Канал</option>
                <option value="group">Группа</option>
                <option value="supergroup">Супергруппа</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Подключение...' : 'Подключить'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Канал
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Подписчиков
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {channels?.map((channel: any) => (
              <tr key={channel.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {channel.channelTitle || channel.channelUsername || 'Без названия'}
                  </div>
                  {channel.channelUsername && (
                    <div className="text-sm text-gray-500">
                      @{channel.channelUsername}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {channel.channelId}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      channel.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {channel.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {channel.subscriberCount || 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Вы уверены, что хотите отключить канал "${channel.channelTitle || channel.channelId}"?`
                        )
                      ) {
                        deleteMutation.mutate(channel.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Отключить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

