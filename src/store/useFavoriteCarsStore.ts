import { create } from 'zustand';

export type Car = {
  id: string;
  brand: string;
  title: string;
  description: string;
  image: string;
  category?: string;
  powerType?: string;
  driveType?: string;
  useCase?: string;
};

type FavoriteCarsState = {
  favorites: Car[];
  toggleFavorite: (car: Car) => void;
  removeFavorite: (id: string) => void;
};

export const useFavoriteCarsStore = create<FavoriteCarsState>((set) => ({
  favorites: [],
  toggleFavorite: (car) =>
    set((state) => {
      const exists = state.favorites.some((item) => item.id === car.id);
      return {
        favorites: exists
          ? state.favorites.filter((item) => item.id !== car.id)
          : [car, ...state.favorites],
      };
    }),
  removeFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.filter((item) => item.id !== id),
    })),
}));
