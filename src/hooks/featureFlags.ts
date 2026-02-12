import { create } from 'zustand';

type FlagState = {
  isLive: boolean;
  setIsLive: (v: boolean) => void;
  isFunctionsEnabled: boolean;
  setIsFunctionsEnabled: (v: boolean) => void;
  refresh: () => Promise<void>;
};

export const useFlags = create<FlagState>((set) => ({
  isLive: false,
  isFunctionsEnabled: false,

  setIsLive: (v) => set({ isLive: v }),
  setIsFunctionsEnabled: (v) => set({ isFunctionsEnabled: v }),

  refresh: async () => {
    set((state) => ({
      isLive: state.isLive,
      isFunctionsEnabled: state.isFunctionsEnabled,
    }));
  },
}));
