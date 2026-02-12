import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export type FavoriteVideo = {
  id: string;
  uri: string;
  title: string;
  duration?: number;
  thumbnailUri?: string;
  addedAt: number;
};

type FavoriteVideosState = {
  favorites: FavoriteVideo[];
  toggleFavorite: (video: Omit<FavoriteVideo, 'addedAt'>) => void;
  removeFavorite: (id: string) => void;
};

const mmkv = new MMKV({ id: 'favorite-videos-store' });

const storage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  removeItem: (name) => {
    mmkv.delete(name);
  },
};

export const useFavoriteVideosStore = create<FavoriteVideosState>()(
  persist(
    (set) => ({
      favorites: [],
      toggleFavorite: (video) =>
        set((state) => {
          const exists = state.favorites.some((item) => item.id === video.id);
          if (exists) {
            return {
              favorites: state.favorites.filter((item) => item.id !== video.id),
            };
          }
          return {
            favorites: [{ ...video, addedAt: Date.now() }, ...state.favorites],
          };
        }),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'favorite-videos-store',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);
