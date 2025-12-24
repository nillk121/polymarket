'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api-client';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CohortsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: cohorts, isLoading } = useQuery({
    queryKey: ['user-cohorts', dateRange],
    queryFn: () =>
      analyticsApi
        .getUserCohorts({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
        .then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Загрузка когорт...</div>
      </div>
    );
  }

  // Преобразуем данные для визуализации
  const chartData =
    cohorts?.map((cohort: any) => {
      const data: any = {
        cohort: new Date(cohort.cohort).toLocaleDateString('ru-RU', {
          month: 'short',
          year: 'numeric',
        }),
        users: cohort.users,
      };

      cohort.activity?.forEach((activity: any, index: number) => {
        data[`Неделя ${activity.week}`] = activity.retention;
      });

      return data;
    }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Когорты пользователей</h1>
          <p className="mt-2 text-gray-600">
            Анализ активности пользователей по когортам регистрации
          </p>
        </div>
        <div className="flex space-x-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Удержание по когортам</h2>
        {chartData.length > 0 && (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cohort" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Неделя 0" stackId="a" fill={COLORS[0]} />
                <Bar dataKey="Неделя 1" stackId="a" fill={COLORS[1]} />
                <Bar dataKey="Неделя 2" stackId="a" fill={COLORS[2]} />
                <Bar dataKey="Неделя 3" stackId="a" fill={COLORS[3]} />
                <Bar dataKey="Неделя 4" stackId="a" fill={COLORS[4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Детали когорт</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Когорта
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Пользователей
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Неделя 0
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Неделя 1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Неделя 2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Неделя 3
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Неделя 4
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {cohorts?.map((cohort: any) => (
                <tr key={cohort.cohort}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {new Date(cohort.cohort).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {cohort.users}
                  </td>
                  {[0, 1, 2, 3, 4].map((week) => {
                    const activity = cohort.activity?.find(
                      (a: any) => a.week === week
                    );
                    return (
                      <td
                        key={week}
                        className="whitespace-nowrap px-6 py-4 text-sm text-gray-500"
                      >
                        {activity
                          ? `${activity.bets} ставок (${activity.retention.toFixed(
                              1
                            )}%)`
                          : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

