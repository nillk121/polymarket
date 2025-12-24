import { create } from 'zustand';

interface MarketState {
  selectedMarket: string | null;
  setSelectedMarket: (marketId: string | null) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  selectedMarket: null,
  setSelectedMarket: (marketId: string | null) => {
    set({ selectedMarket: marketId });
  },
}));

