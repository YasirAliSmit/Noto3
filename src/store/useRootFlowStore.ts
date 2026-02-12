import { create } from 'zustand';

type RootFlowState = {
  isInitialFlow: boolean;
  setInitialFlow: (value: boolean) => void;
};

export const useRootFlowStore = create<RootFlowState>((set) => ({
  isInitialFlow: true,
  setInitialFlow: (value) => set({ isInitialFlow: value }),
}));
