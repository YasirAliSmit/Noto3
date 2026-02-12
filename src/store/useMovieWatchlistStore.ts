// NEW CODE: movie watchlist store
import { create } from 'zustand';
import { storage } from '../storage/mmkv';

export type WatchlistMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
};

type MovieWatchlistState = {
  watchlist: WatchlistMovie[];
  toggleWatchlist: (movie: WatchlistMovie) => void;
  removeFromWatchlist: (id: number) => void;
};

const WATCHLIST_KEY = 'movieWatchlist';

const readWatchlist = (): WatchlistMovie[] => {
  const raw = storage.getString(WATCHLIST_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as WatchlistMovie[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistWatchlist = (watchlist: WatchlistMovie[]) => {
  storage.set(WATCHLIST_KEY, JSON.stringify(watchlist));
};

export const useMovieWatchlistStore = create<MovieWatchlistState>((set) => ({
  watchlist: readWatchlist(),
  toggleWatchlist: (movie) =>
    set((state) => {
      const exists = state.watchlist.some((item) => item.id === movie.id);
      const next = exists
        ? state.watchlist.filter((item) => item.id !== movie.id)
        : [movie, ...state.watchlist];
      persistWatchlist(next);
      return { watchlist: next };
    }),
  removeFromWatchlist: (id) =>
    set((state) => {
      const next = state.watchlist.filter((item) => item.id !== id);
      persistWatchlist(next);
      return { watchlist: next };
    }),
}));
