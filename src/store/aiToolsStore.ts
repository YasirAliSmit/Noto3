import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

import { generateId } from '../utils/id';

export type AiToolHistoryEntry = {
  id: string;
  toolId: string;
  prompt: string;
  result: string;
  createdAt: number;
};

type AiToolsState = {
  favorites: string[];
  history: AiToolHistoryEntry[];
  toggleFavorite: (toolId: string) => void;
  addHistoryEntry: (input: Omit<AiToolHistoryEntry, 'id' | 'createdAt'> & { createdAt?: number }) => AiToolHistoryEntry;
  clearHistory: () => void;
};

const mmkv = new MMKV({ id: 'ai-tools-store' });

const storage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  removeItem: (name) => {
    mmkv.delete(name);
  },
};

export const useAiToolsStore = create<AiToolsState>()(
  persist(
    (set, get) => ({
      favorites: [],
      history: [],
      toggleFavorite: (toolId) => {
        set((state) => {
          const exists = state.favorites.includes(toolId);
          return {
            favorites: exists
              ? state.favorites.filter((id) => id !== toolId)
              : [...state.favorites, toolId],
          };
        });
      },
      addHistoryEntry: ({ toolId, prompt, result, createdAt }) => {
        const entry: AiToolHistoryEntry = {
          id: generateId(),
          toolId,
          prompt,
          result,
          createdAt: createdAt ?? Date.now(),
        };
        set((state) => ({
          history: [entry, ...state.history].slice(0, 200),
        }));
        return entry;
      },
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'ai-tools-store',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ favorites: state.favorites, history: state.history }),
    },
  ),
);
