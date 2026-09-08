import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useFavorites } from "../lib/FavoritesContext";

export function FavoriteButton({ ticker }) {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const isFavorite = favorites.includes(ticker);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    toggleFavorite(ticker);
  }

  return (
    <button
      type="button"
      className={`favorite-star${isFavorite ? " active" : ""}`}
      onClick={handleClick}
      aria-label={isFavorite ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
      title={isFavorite ? "Remove from watchlist" : "Add to watchlist"}
    >
      {isFavorite ? "★" : "☆"}
    </button>
  );
}
