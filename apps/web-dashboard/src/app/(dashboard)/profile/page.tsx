'use client';

import { useEffect, useState } from 'react';
import { authApi, User } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    authApi
      .getMe()
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading profile:', err);
        setError('Не удалось загрузить профиль');
        setLoading(false);
        // Если ошибка авторизации, перенаправляем на логин
        if (err.response?.status === 401) {
          router.push('/login');
        }
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Загрузка профиля...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-800">{error || 'Профиль не найден'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
        <p className="mt-2 text-gray-600">Информация о вашем аккаунте</p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-6 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Имя пользователя</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.username || 'Не указано'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Имя</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.firstName || 'Не указано'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Фамилия</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.lastName || 'Не указано'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.email || 'Не указано'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Telegram ID</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.telegramId || 'Не указано'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Телефон</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.phone || 'Не указано'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Статус</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Верифицирован</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user.isVerified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {user.isVerified ? 'Да' : 'Нет'}
                </span>
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Роли</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role, index) => (
                      <span
                        key={index}
                        className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                      >
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Роли не назначены</span>
                  )}
                </div>
              </dd>
            </div>

            {user.lastLoginAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Последний вход</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.lastLoginAt).toLocaleString('ru-RU')}
                </dd>
              </div>
            )}

            {user.createdAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Дата регистрации</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleString('ru-RU')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

