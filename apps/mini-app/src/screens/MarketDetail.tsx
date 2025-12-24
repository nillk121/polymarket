import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { marketsApi, Market } from '../api/markets';
import Decimal from 'decimal.js';
import { formatDistanceToNow } from 'date-fns';

export default function MarketDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { data: market, isLoading, error } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getMarket(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-lg p-4 h-64" />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {t('markets.errorLoadingMarket')}
        </div>
      </div>
    );
  }

  const totalShares = market.outcomes.reduce(
    (sum, o) => sum.plus(new Decimal(o.shares)),
    new Decimal(0)
  );

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{market.title}</h1>
        {market.category && (
          <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded mb-3">
            {market.category.name}
          </span>
        )}
        <p className="text-gray-700 mb-4">{market.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-600">{t('markets.totalVolume')}</div>
            <div className="text-lg font-semibold text-gray-900">
              {new Decimal(market.totalVolume).toFixed(2)} TON
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">{t('markets.totalBets')}</div>
            <div className="text-lg font-semibold text-gray-900">
              {market.totalBets}
            </div>
          </div>
        </div>

        {market.endDate && (
          <div className="text-sm text-gray-600 mb-4">
            {t('markets.endsIn')} {formatDistanceToNow(new Date(market.endDate), { addSuffix: true })}
          </div>
        )}

        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">{t('markets.outcomes')}</div>
          <div className="space-y-2">
            {market.outcomes.map((outcome) => {
              const shares = new Decimal(outcome.shares);
              const probability = totalShares.isZero()
                ? new Decimal(0)
                : shares.div(totalShares).times(100);
              const volume = new Decimal(outcome.totalVolume);

              return (
                <div
                  key={outcome.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-gray-900">{outcome.name}</div>
                    <div className="text-lg font-bold text-primary-600">
                      {probability.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{t('markets.shares')}: {shares.toFixed(2)}</span>
                    <span>{t('markets.volume')}: {volume.toFixed(2)} TON</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${probability.toFixed(1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {market.status === 'active' && (
          <Link
            to={`/markets/${market.id}/bet`}
            className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            {t('markets.placeBet')}
          </Link>
        )}

        {market.status === 'resolved' && market.resolvedOutcomeId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm font-semibold text-green-800 mb-1">
              {t('markets.marketResolved')}
            </div>
            <div className="text-sm text-green-700">
              {t('markets.winner')}: {market.outcomes.find((o) => o.id === market.resolvedOutcomeId)?.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

