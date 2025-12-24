import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { marketsApi } from '../api/markets';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import Decimal from 'decimal.js';

export default function MarketsList() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['markets', { status: 'active' }],
    queryFn: () => marketsApi.getMarkets({ status: 'active', limit: 20 }),
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {t('markets.errorLoading')}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('markets.title')}</h1>
        <p className="text-gray-600 mt-1">{t('markets.subtitle')}</p>
      </div>

      {data?.markets.map((market) => (
        <Link
          key={market.id}
          to={`/markets/${market.id}`}
          className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold text-gray-900 flex-1">
              {market.title}
            </h2>
            {market.category && (
              <span className="ml-2 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                {market.category.name}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {market.description}
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {t('markets.volume')}: {new Decimal(market.totalVolume).toFixed(2)} TON
              </span>
              <span className="text-gray-600">
                {market.totalBets} {t('markets.bets')}
              </span>
            </div>
            {market.endDate && (
              <span className="text-gray-500">
                {formatDistanceToNow(new Date(market.endDate), { addSuffix: true })}
              </span>
            )}
          </div>

          {market.outcomes && market.outcomes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex space-x-2">
                {market.outcomes.slice(0, 2).map((outcome) => {
                  const totalShares = market.outcomes.reduce(
                    (sum, o) => sum.plus(new Decimal(o.shares)),
                    new Decimal(0)
                  );
                  const probability = totalShares.isZero()
                    ? new Decimal(0)
                    : new Decimal(outcome.shares).div(totalShares).times(100);

                  return (
                    <div
                      key={outcome.id}
                      className="flex-1 bg-gray-50 rounded p-2"
                    >
                      <div className="text-xs text-gray-600 mb-1">
                        {outcome.name}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {probability.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Link>
      ))}

      {data?.markets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('markets.noMarkets')}</p>
        </div>
      )}
    </div>
  );
}

