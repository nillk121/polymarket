import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { betsApi } from '../api/bets';
import { format } from 'date-fns';
import Decimal from 'decimal.js';

export default function Profile() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const { data: bets, error: betsError } = useQuery({
    queryKey: ['bets', 'user'],
    queryFn: () => betsApi.getBets({ limit: 10 }),
    enabled: !!user,
    retry: false,
  });

  if (!user) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {t('profile.notAuthenticated')}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
        <p className="text-gray-600 mt-1">{t('profile.subtitle')}</p>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.firstName || user.username}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl text-primary-600">
                {user.firstName?.[0] || user.username?.[0] || 'U'}
              </span>
            </div>
          )}
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username || `User ${user.telegramId}`}
            </div>
            {user.username && (
              <div className="text-sm text-gray-600">@{user.username}</div>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('profile.telegramId')}</span>
            <span className="font-mono text-gray-900">{user.telegramId}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.recentBets')}</h2>
        {betsError ? (
          <div className="text-center py-8 text-gray-500">
            {t('errors.unauthorized')}
          </div>
        ) : bets?.bets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('profile.noBets')}
          </div>
        ) : (
          <div className="space-y-2">
            {bets?.bets.map((bet) => (
              <div
                key={bet.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {bet.market?.title || 'Market'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {bet.outcome?.name} • {bet.type.toUpperCase()}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 text-xs rounded capitalize ${
                      bet.status === 'won'
                        ? 'bg-green-100 text-green-800'
                        : bet.status === 'lost'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {t(`status.${bet.status}`)}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {format(new Date(bet.createdAt), 'MMM d, yyyy')}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {new Decimal(bet.totalCost).toFixed(2)} TON
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
      >
        {t('profile.logout')}
      </button>
    </div>
  );
}

