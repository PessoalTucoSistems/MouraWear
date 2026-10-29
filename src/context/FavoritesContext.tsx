import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const KEY = "mw_favorites";

// Favoritos ficam no navegador: dá para salvar peças sem precisar de login.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(favorites));
    } catch {
      /* armazenamento indisponível */
    }
  }, [favorites]);

  const value: FavoritesContextValue = {
    favorites,
    isFavorite: (id) => favorites.includes(id),
    toggleFavorite: (id) =>
      setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id])),
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites precisa estar dentro de FavoritesProvider");
  return ctx;
};
