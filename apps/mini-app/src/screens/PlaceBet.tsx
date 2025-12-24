import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketsApi } from '../api/markets';
import { betsApi, PlaceBetDto } from '../api/bets';
import { walletApi } from '../api/wallet';
import { useAuthStore } from '../store/authStore';
import Decimal from 'decimal.js';
import WebApp from '@twa-dev/sdk';

export default function PlaceBet() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>('');
  const [betType, setBetType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState<'shares' | 'cost'>('cost');

  // Fetch market
  const { data: market, isLoading: marketLoading } = useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getMarket(id!),
    enabled: !!id,
  });

  // Fetch user wallets
  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletApi.getWallets(),
    enabled: !!user,
  });

  const internalWallet = wallets?.find((w) => w.type === 'internal' && w.isActive);

  // Fetch balance
  const { data: balance } = useQuery({
    queryKey: ['balance', internalWallet?.id],
    queryFn: () => walletApi.getBalance(internalWallet?.id || '', 'TON'),
    enabled: !!internalWallet,
  });

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: (data: PlaceBetDto) => betsApi.placeBet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      WebApp.showAlert(t('bet.betPlaced'));
      navigate(`/markets/${id}`);
    },
    onError: (error: any) => {
      WebApp.showAlert(error.response?.data?.message || t('bet.betFailed'));
    },
  });

  const handlePlaceBet = () => {
    if (!selectedOutcomeId || !amount || !internalWallet) {
      WebApp.showAlert(t('bet.fillAllFields'));
      return;
    }

    const betData: PlaceBetDto = {
      marketId: id!,
      outcomeId: selectedOutcomeId,
      walletId: internalWallet.id,
      type: betType,
      [amountType === 'cost' ? 'cost' : 'shares']: amount,
    };

    placeBetMutation.mutate(betData);
  };

  if (marketLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-lg p-4 h-64" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {t('bet.marketNotFound')}
        </div>
      </div>
    );
  }

  const availableBalance = balance
    ? new Decimal(balance.availableAmount)
    : new Decimal(0);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{market.title}</h1>
        <p className="text-gray-600 text-sm mb-4">{market.description}</p>

        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">{t('bet.betType')}</div>
          <div className="flex space-x-2">
            <button
              onClick={() => setBetType('buy')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                betType === 'buy'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('bet.buy')}
            </button>
            <button
              onClick={() => setBetType('sell')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                betType === 'sell'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('bet.sell')}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">{t('bet.selectOutcome')}</div>
          <div className="space-y-2">
            {market.outcomes.map((outcome) => (
              <button
                key={outcome.id}
                onClick={() => setSelectedOutcomeId(outcome.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selectedOutcomeId === outcome.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-semibold text-gray-900">{outcome.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-semibold text-gray-900">{t('bet.amount')}</div>
            <div className="text-xs text-gray-600">
              {t('bet.available')}: {availableBalance.toFixed(2)} TON
            </div>
          </div>
          <div className="flex space-x-2 mb-2">
            <button
              onClick={() => setAmountType('cost')}
              className={`px-3 py-1 text-sm rounded ${
                amountType === 'cost'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('bet.cost')}
            </button>
            <button
              onClick={() => setAmountType('shares')}
              className={`px-3 py-1 text-sm rounded ${
                amountType === 'shares'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('bet.shares')}
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={amountType === 'cost' ? t('bet.enterCost') : t('bet.enterShares')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            step="0.01"
            min="0"
          />
        </div>

        <button
          onClick={handlePlaceBet}
          disabled={placeBetMutation.isPending || !selectedOutcomeId || !amount}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {placeBetMutation.isPending ? t('bet.placingBet') : t('bet.placeBet')}
        </button>
      </div>
    </div>
  );
}

