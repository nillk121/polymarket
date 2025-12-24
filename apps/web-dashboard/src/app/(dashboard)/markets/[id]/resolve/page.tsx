'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketsApi } from '@/lib/api-client';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';

export default function ResolveMarketPage() {
  const router = useRouter();
  const params = useParams();
  const marketId = params.id as string;
  const queryClient = useQueryClient();

  const [resolvedOutcomeId, setResolvedOutcomeId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: market, isLoading } = useQuery({
    queryKey: ['market', marketId],
    queryFn: () => marketsApi.getOne(marketId).then((res) => res.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (data: { resolvedOutcomeId: string; resolutionNotes?: string }) =>
      marketsApi.resolve(marketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
      router.push('/markets');
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (!market) {
    return <div className="text-center py-8">Рынок не найден</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedOutcomeId) {
      alert('Выберите исход');
      return;
    }
    resolveMutation.mutate({ resolvedOutcomeId, resolutionNotes });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Разрешение рынка</h1>
        <p className="mt-2 text-gray-600">{market.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Выберите исход
          </label>
          <div className="mt-2 space-y-2">
            {market.outcomes?.map((outcome: any) => (
              <label
                key={outcome.id}
                className="flex cursor-pointer items-center rounded-md border border-gray-300 p-4 hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="outcome"
                  value={outcome.id}
                  checked={resolvedOutcomeId === outcome.id}
                  onChange={(e) => setResolvedOutcomeId(e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {outcome.title}
                  </div>
                  {outcome.description && (
                    <div className="text-sm text-gray-500">
                      {outcome.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Примечания (необязательно)
          </label>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            placeholder="Добавьте примечания к разрешению..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!resolvedOutcomeId || resolveMutation.isPending}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {resolveMutation.isPending ? 'Разрешение...' : 'Разрешить рынок'}
          </button>
        </div>
      </form>
    </div>
  );
}

