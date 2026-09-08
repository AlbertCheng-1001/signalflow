import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useFavorites } from "../lib/FavoritesContext";
import { FavoriteButton } from "../components/FavoriteButton";

export function Watchlist() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();

  if (!user) {
    return (
      <div className="empty-state">
        <p>Log in to build a personal watchlist of favorite tickers.</p>
        <Link to="/login" className="btn-primary">Log in</Link>
      </div>
    );
  }

  if (loading) {
    return <p className="page-note">Loading your watchlist…</p>;
  }

  if (favorites.length === 0) {
    return (
      <div className="empty-state">
        <p>You haven't added any favorites yet.</p>
        <p className="page-note">
          Click the star next to any ticker on the Dashboard to add it to your watchlist.
        </p>
      </div>
    );
  }

  return (
    <div className="watchlist-grid">
      {favorites.map((ticker) => (
        <div key={ticker} className="watchlist-card">
          <Link to={`/ticker/${ticker}`} className="watchlist-card-ticker">{ticker}</Link>
          <FavoriteButton ticker={ticker} />
        </div>
      ))}
    </div>
  );
}
