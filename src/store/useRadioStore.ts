import { create } from 'zustand';

export type Station = {
  id: string;
  name: string;
  url: string;
  country?: string;
  bitrate?: number;
  artwork?: string;
  artist?: string;
};

type RadioState = {
  current?: Station;
  currentIndex: number;
  queue: Station[];
  liked: Record<string, boolean>;
  setCurrent: (station?: Station) => void;
  setQueue: (stations: Station[], startId?: string) => void;
  toggleLike: (id: string) => void;
  playAt: (index: number) => Station | undefined;
  playNext: () => Station | undefined;
  playPrevious: () => Station | undefined;
  playRandom: () => Station | undefined;
};

export const useRadioStore = create<RadioState>((set, get) => ({
  current: undefined,
  currentIndex: -1,
  queue: [],
  liked: {},
  setCurrent: (station) =>
    set((state) => {
      if (!station) {
        return { current: undefined, currentIndex: -1 };
      }
      const index = state.queue.findIndex((item) => item.id === station.id);
      return {
        current: station,
        currentIndex: index,
      };
    }),
  setQueue: (stations, startId) =>
    set((state) => {
      const seen = new Set<string>();
      const unique = stations.filter((station) => {
        if (!station || seen.has(station.id)) {
          return false;
        }
        seen.add(station.id);
        return true;
      });

      const currentId = startId ?? state.current?.id;
      let currentIndex = -1;
      if (currentId) {
        currentIndex = unique.findIndex((station) => station.id === currentId);
      }

      const nextCurrent =
        currentIndex >= 0 ? unique[currentIndex] : state.current && state.queue.length ? state.current : unique[0];

      if (nextCurrent && currentIndex === -1) {
        currentIndex = unique.findIndex((station) => station.id === nextCurrent.id);
      }

      return {
        queue: unique,
        current: nextCurrent,
        currentIndex,
      };
    }),
  toggleLike: (id) => {
    const currentLiked = get().liked[id];
    set((state) => ({
      liked: { ...state.liked, [id]: !currentLiked },
    }));
  },
  playAt: (index) => {
    const { queue } = get();
    if (!queue.length) {
      return undefined;
    }
    const safeIndex = ((index % queue.length) + queue.length) % queue.length;
    const target = queue[safeIndex];
    set({ current: target, currentIndex: safeIndex });
    return target;
  },
  playNext: () => {
    const { queue, currentIndex } = get();
    if (!queue.length) {
      return undefined;
    }
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % queue.length : 0;
    return get().playAt(nextIndex);
  },
  playPrevious: () => {
    const { queue, currentIndex } = get();
    if (!queue.length) {
      return undefined;
    }
    const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + queue.length) % queue.length : queue.length - 1;
    return get().playAt(prevIndex);
  },
  playRandom: () => {
    const { queue, currentIndex } = get();
    if (!queue.length) {
      return undefined;
    }
    if (queue.length === 1) {
      return get().playAt(currentIndex >= 0 ? currentIndex : 0);
    }
    let randomIndex = currentIndex;
    while (randomIndex === currentIndex) {
      randomIndex = Math.floor(Math.random() * queue.length);
    }
    return get().playAt(randomIndex);
  },
}));
