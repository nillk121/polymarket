'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { authApi } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    authApi.getMe().then(setUser).catch(console.error);
  }, []);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  const stats = dashboardData || {
    totalUsers: 0,
    totalMarkets: 0,
    activeMarkets: 0,
    totalBets: 0,
    totalVolume: 0,
    totalPayouts: 0,
  };

  const statCards = [
    {
      title: 'Всего пользователей',
      value: stats.totalUsers || 0,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Всего рынков',
      value: stats.totalMarkets || 0,
      icon: '📈',
      color: 'bg-green-500',
    },
    {
      title: 'Активных рынков',
      value: stats.activeMarkets || 0,
      icon: '🔥',
      color: 'bg-orange-500',
    },
    {
      title: 'Всего ставок',
      value: stats.totalBets || 0,
      icon: '🎯',
      color: 'bg-purple-500',
    },
    {
      title: 'Общий объем',
      value: `${(stats.totalVolume || 0).toLocaleString()} TON`,
      icon: '💰',
      color: 'bg-yellow-500',
    },
    {
      title: 'Выплат',
      value: stats.totalPayouts || 0,
      icon: '💸',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Дашборд</h1>
        <p className="mt-2 text-gray-600">
          Добро пожаловать, {user?.username || user?.firstName || 'Администратор'}!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-md ${stat.color} text-white`}
                >
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

