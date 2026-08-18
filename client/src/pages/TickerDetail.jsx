import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePolling } from "../lib/usePolling";
import { PriceChart } from "../components/PriceChart";
import { StatusBadge, CATEGORY_STATUS, URGENCY_STATUS } from "../components/StatusBadge";
import { timeAgo } from "../lib/time";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function TickerDetail() {
  const { ticker } = useParams();
  const [candles, setCandles] = useState([]);
  const [candlesError, setCandlesError] = useState(null);
  const [loadingCandles, setLoadingCandles] = useState(true);

  const { items: allEvents } = usePolling("/api/events", "events", "classified_at");
  const tickerEvents = useMemo(() => allEvents.filter((e) => e.ticker === ticker), [allEvents, ticker]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCandles(true);

    fetch(`${API_BASE}/api/tickers/${ticker}/candles?range=3mo`)
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setCandles(data.candles);
          setCandlesError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setCandlesError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingCandles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  return (
    <>
      <Link to="/" className="back-link">&larr; Back to dashboard</Link>
      <h2 className="page-title">{ticker}</h2>

      {candlesError && <div className="error-banner">Failed to load price history: {candlesError}</div>}

      {loadingCandles ? (
        <p className="page-note">Loading price history…</p>
      ) : (
        <PriceChart ticker={ticker} candles={candles} events={tickerEvents} />
      )}

      <table className="events-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Category</th>
            <th>Urgency</th>
            <th>Relevance</th>
            <th>Rationale</th>
            <th>Classified</th>
          </tr>
        </thead>
        <tbody>
          {tickerEvents.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty">No events yet for {ticker}.</td>
            </tr>
          ) : (
            tickerEvents.map((e) => (
              <tr key={e.id}>
                <td className="cell-muted">{e.type}</td>
                <td><StatusBadge value={e.category} status={CATEGORY_STATUS[e.category]} /></td>
                <td><StatusBadge value={e.urgency} status={URGENCY_STATUS[e.urgency]} /></td>
                <td className="cell-tabular">{e.relevance}</td>
                <td className="cell-rationale">{e.rationale}</td>
                <td className="cell-muted" title={new Date(e.classified_at).toLocaleString()}>
                  {timeAgo(e.classified_at)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
