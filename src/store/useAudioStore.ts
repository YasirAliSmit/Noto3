import { create } from 'zustand';

export type Station = {
  id: string;
  name: string;
  country?: string;
  bitrate?: number;
  streamUrl?: string;
};

export type ImportedTrack = {
  id: string;
  name: string;
  uri: string;
  size?: number | null;
};

type AudioState = {
  likedStations: Record<string, Station>;
  playCounts: Record<string, number>;
  stationCatalog: Record<string, Station>;
  importedTracks: ImportedTrack[];
  currentStation?: Station;
  toggleLike: (station: Station) => void;
  isLiked: (id: string) => boolean;
  incrementPlayCount: (station: Station) => void;
  setCurrentStation: (station: Station | undefined) => void;
  addStationToCatalog: (station: Station) => void;
  addImportedTrack: (track: ImportedTrack) => void;
  registerStations: (stations: Station[]) => void;
};

export const useAudioStore = create<AudioState>((set, get) => ({
  likedStations: {},
  playCounts: {},
  stationCatalog: {},
  importedTracks: [],
  currentStation: undefined,
  toggleLike: (station) =>
    set((state) => {
      const next = { ...state.likedStations };
      if (next[station.id]) {
        delete next[station.id];
      } else {
        next[station.id] = station;
      }
      return { likedStations: next, stationCatalog: { ...state.stationCatalog, [station.id]: station } };
    }),
  isLiked: (id) => Boolean(get().likedStations[id]),
  incrementPlayCount: (station) =>
    set((state) => {
      const currentCount = state.playCounts[station.id] ?? 0;
      return {
        playCounts: { ...state.playCounts, [station.id]: currentCount + 1 },
        stationCatalog: { ...state.stationCatalog, [station.id]: station },
      };
    }),
  setCurrentStation: (station) => set({ currentStation: station }),
  addStationToCatalog: (station) =>
    set((state) => ({
      stationCatalog: { ...state.stationCatalog, [station.id]: station },
    })),
  addImportedTrack: (track) =>
    set((state) => {
      const exists = state.importedTracks.some((item) => item.id === track.id);
      if (exists) {
        return state;
      }
      return { importedTracks: [...state.importedTracks, track] };
    }),
  registerStations: (stations) =>
    set((state) => {
      if (!stations.length) {
        return state;
      }
      const next = { ...state.stationCatalog };
      stations.forEach((station) => {
        next[station.id] = station;
      });
      return { stationCatalog: next };
    }),
}));
