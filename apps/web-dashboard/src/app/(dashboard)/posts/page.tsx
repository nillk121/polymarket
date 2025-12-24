'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi, channelsApi, postTemplatesApi } from '@/lib/api-client';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  scheduled: 'Запланирован',
  published: 'Опубликован',
  archived: 'Архивирован',
};

export default function PostsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    channelId: '',
    templateId: '',
    marketId: '',
    title: '',
    content: '',
    status: 'draft',
    scheduledAt: '',
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () =>
      postsApi.getAll({ page, limit: 20 }).then((res) => res.data),
  });

  const { data: channels } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsApi.getAll().then((res) => res.data),
  });

  const { data: templates } = useQuery({
    queryKey: ['post-templates'],
    queryFn: () => postTemplatesApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => postsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowCreateForm(false);
      setFormData({
        channelId: '',
        templateId: '',
        marketId: '',
        title: '',
        content: '',
        status: 'draft',
        scheduledAt: '',
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => postsApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      scheduledAt: formData.scheduledAt || undefined,
    };
    createMutation.mutate(data);
  };

  const postsList = posts?.data || [];
  const totalPages = posts?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Посты</h1>
          <p className="mt-2 text-gray-600">Управление постами в каналах</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {showCreateForm ? 'Отмена' : 'Создать пост'}
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-white p-6 shadow"
        >
          <h2 className="mb-4 text-lg font-semibold">Создать пост</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Канал
              </label>
              <select
                value={formData.channelId}
                onChange={(e) =>
                  setFormData({ ...formData, channelId: e.target.value })
                }
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              >
                <option value="">Выберите канал</option>
                {channels?.map((channel: any) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.channelTitle || channel.channelUsername}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Шаблон (необязательно)
              </label>
              <select
                value={formData.templateId}
                onChange={(e) =>
                  setFormData({ ...formData, templateId: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              >
                <option value="">Без шаблона</option>
                {templates?.map((template: any) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Заголовок
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Содержание *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                rows={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Статус
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              >
                <option value="draft">Черновик</option>
                <option value="scheduled">Запланирован</option>
                <option value="published">Опубликован</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Запланировать на (необязательно)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledAt: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Заголовок
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Канал
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Просмотры / Клики
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Дата публикации
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {postsList.map((post: any) => (
              <tr key={post.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {post.title || 'Без заголовка'}
                  </div>
                  <div className="text-sm text-gray-500 line-clamp-2">
                    {post.content.substring(0, 100)}...
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {post.channel?.channelTitle || post.channel?.channelUsername || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      statusColors[post.status] || statusColors.draft
                    }`}
                  >
                    {statusLabels[post.status] || post.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {post.viewsCount || 0} / {post.clicksCount || 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), 'dd.MM.yyyy HH:mm', {
                        locale: ru,
                      })
                    : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {post.status === 'draft' && (
                      <button
                        onClick={() => publishMutation.mutate(post.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Опубликовать
                      </button>
                    )}
                    <Link
                      href={`/posts/${post.id}/stats`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Статистика
                    </Link>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Вы уверены, что хотите удалить пост "${post.title || post.id}"?`
                          )
                        ) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
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

