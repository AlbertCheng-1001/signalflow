import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user, authFetch } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    authFetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => setFavorites(data.tickers ?? []))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleFavorite = useCallback(
    async (ticker) => {
      if (!user) return;
      const isFav = favorites.includes(ticker);
      // Optimistic update — reverted if the request fails.
      setFavorites((prev) => (isFav ? prev.filter((t) => t !== ticker) : [...prev, ticker]));
      try {
        const res = await authFetch(`/api/favorites${isFav ? `/${ticker}` : ""}`, {
          method: isFav ? "DELETE" : "POST",
          headers: isFav ? undefined : { "Content-Type": "application/json" },
          body: isFav ? undefined : JSON.stringify({ ticker }),
        });
        if (!res.ok) throw new Error("failed to update favorite");
      } catch {
        setFavorites((prev) => (isFav ? [...prev, ticker] : prev.filter((t) => t !== ticker)));
      }
    },
    [favorites, user, authFetch]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
