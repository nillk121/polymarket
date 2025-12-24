'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api-client';
import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['analytics-dashboard', dateRange],
    queryFn: () =>
      analyticsApi
        .getDashboard({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
        .then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Загрузка аналитики...</div>
      </div>
    );
  }

  const data = dashboardData || {
    stats: {},
    trafficSources: [],
    betTiming: [],
    popularMarkets: [],
    liquidityDepth: [],
    dauMau: { dau: [], mau: 0, avgDAU: 0, stickiness: 0 },
    conversionFunnel: [],
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
          <p className="mt-2 text-gray-600">
            Детальная аналитика платформы
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

      {/* DAU / MAU */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">DAU / MAU</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="text-sm text-gray-600">Средний DAU</div>
            <div className="text-2xl font-bold text-blue-600">
              {data.dauMau?.avgDAU || 0}
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="text-sm text-gray-600">MAU (30 дней)</div>
            <div className="text-2xl font-bold text-green-600">
              {data.dauMau?.mau || 0}
            </div>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <div className="text-sm text-gray-600">Липкость</div>
            <div className="text-2xl font-bold text-purple-600">
              {data.dauMau?.stickiness
                ? `${data.dauMau.stickiness.toFixed(1)}%`
                : '0%'}
            </div>
          </div>
        </div>
        {data.dauMau?.dau && data.dauMau.dau.length > 0 && (
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dauMau.dau}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="dau"
                  stroke="#0088FE"
                  name="DAU"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Воронка конверсии */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Воронка конверсии</h2>
        {data.conversionFunnel && data.conversionFunnel.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.conversionFunnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" name="Количество" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 space-y-2">
          {data.conversionFunnel?.map((stage: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{stage.stage}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">{stage.count}</span>
                {stage.conversion !== undefined && (
                  <span className="text-sm text-gray-500">
                    {stage.conversion.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Время ставок */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Время ставок (по часам)</h2>
        {data.betTiming && data.betTiming.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.betTiming}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#00C49F" name="Количество ставок" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Популярные рынки */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Популярные рынки</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Рынок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Просмотры
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ставки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Конверсия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.popularMarkets?.slice(0, 10).map((market: any) => (
                <tr key={market.marketId}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {market.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {market.views || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {market.bets || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {market.conversionRate
                      ? `${market.conversionRate.toFixed(2)}%`
                      : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Источники трафика */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Источники трафика</h2>
        {data.trafficSources && data.trafficSources.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.trafficSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalEvents"
                >
                  {data.trafficSources.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 space-y-2">
          {data.trafficSources?.map((source: any) => (
            <div
              key={source.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
            >
              <div>
                <div className="font-medium">{source.name}</div>
                <div className="text-sm text-gray-500">{source.type}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{source.totalEvents}</div>
                <div className="text-sm text-gray-500">
                  {source.uniqueUsers} уникальных пользователей
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Глубина ликвидности */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Глубина ликвидности</h2>
        <div className="space-y-4">
          {data.liquidityDepth?.slice(0, 5).map((market: any) => (
            <div key={market.marketId} className="rounded-lg border p-4">
              <div className="mb-2 font-medium">{market.title}</div>
              <div className="mb-2 text-sm text-gray-600">
                Общая ликвидность: {market.totalLiquidity.toFixed(2)} TON
              </div>
              <div className="space-y-2">
                {market.outcomes?.map((outcome: any) => (
                  <div key={outcome.outcomeId}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{outcome.title}</span>
                      <span>
                        {outcome.liquidity.toFixed(2)} TON (
                        {outcome.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${outcome.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

