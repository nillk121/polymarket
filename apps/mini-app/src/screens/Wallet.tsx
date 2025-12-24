import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { walletApi } from '../api/wallet';
import { useAuthStore } from '../store/authStore';
import Decimal from 'decimal.js';
import { format } from 'date-fns';

export default function Wallet() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletApi.getWallets(),
    enabled: !!user,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => walletApi.getTransactions({ limit: 20 }),
    enabled: !!user,
  });

  const internalWallet = wallets?.find((w) => w.type === 'internal' && w.isActive);
  const tonBalance = internalWallet?.balances.find((b) => b.currency === 'TON');

  if (walletsLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-lg p-4 h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('wallet.title')}</h1>
        <p className="text-gray-600 mt-1">{t('wallet.subtitle')}</p>
      </div>

      {tonBalance && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">{t('wallet.totalBalance')}</div>
          <div className="text-3xl font-bold mb-1">
            {new Decimal(tonBalance.amount).toFixed(2)} TON
          </div>
          <div className="text-sm opacity-90 mt-2">
            {t('wallet.available')}: {new Decimal(tonBalance.availableAmount).toFixed(2)} TON
          </div>
          {new Decimal(tonBalance.lockedAmount).gt(0) && (
            <div className="text-sm opacity-90">
              {t('wallet.locked')}: {new Decimal(tonBalance.lockedAmount).toFixed(2)} TON
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('wallet.wallets')}</h2>
        <div className="space-y-2">
          {wallets?.map((wallet) => (
            <div
              key={wallet.id}
              className="border border-gray-200 rounded-lg p-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-900 capitalize">
                    {wallet.type.replace('_', ' ')}
                  </div>
                  {wallet.address && (
                    <div className="text-xs text-gray-600 font-mono">
                      {wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {wallet.balances.map((balance) => (
                    <div key={balance.id} className="text-sm font-semibold text-gray-900">
                      {new Decimal(balance.amount).toFixed(2)} {balance.currency}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('wallet.recentTransactions')}</h2>
        {transactionsLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        ) : transactions?.transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('wallet.noTransactions')}
          </div>
        ) : (
          <div className="space-y-2">
            {transactions?.transactions.map((tx) => (
              <div
                key={tx.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">
                      {t(`wallet.${tx.type}`)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        tx.type === 'deposit' || tx.type === 'payout'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'deposit' || tx.type === 'payout' ? '+' : '-'}
                      {new Decimal(tx.amount).toFixed(2)} {tx.currency}
                    </div>
                    <div className="text-xs text-gray-600 capitalize">
                      {t(`status.${tx.status}`)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

