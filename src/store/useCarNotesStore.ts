// NEW CODE: car notes store
import { create } from 'zustand';
import { storage } from '../storage/mmkv';

type CarNotesState = {
  notes: Record<string, string>;
  setNote: (carId: string, note: string) => void;
  clearNote: (carId: string) => void;
};

const NOTES_KEY = 'carNotes';

const readNotes = (): Record<string, string> => {
  const raw = storage.getString(NOTES_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const persistNotes = (notes: Record<string, string>) => {
  storage.set(NOTES_KEY, JSON.stringify(notes));
};

export const useCarNotesStore = create<CarNotesState>((set) => ({
  notes: readNotes(),
  setNote: (carId, note) =>
    set((state) => {
      const trimmed = note.trim();
      const next = { ...state.notes };
      if (trimmed) {
        next[carId] = trimmed;
      } else {
        delete next[carId];
      }
      persistNotes(next);
      return { notes: next };
    }),
  clearNote: (carId) =>
    set((state) => {
      const next = { ...state.notes };
      delete next[carId];
      persistNotes(next);
      return { notes: next };
    }),
}));
