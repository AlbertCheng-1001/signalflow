import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePolling } from "../lib/usePolling";
import { PriceChart } from "../components/PriceChart";
import { StatusBadge, CATEGORY_STATUS, URGENCY_STATUS } from "../components/StatusBadge";
import { SourceLink } from "../components/SourceLink";
import { timeAgo } from "../lib/time";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const CANDLE_REFRESH_MS = 60000;

const RANGES = [
  { key: "1d", label: "1D" },
  { key: "3d", label: "3D" },
  { key: "1w", label: "1W" },
  { key: "1mo", label: "1M" },
];

export function TickerDetail() {
  const { ticker } = useParams();
  const [range, setRange] = useState("1d");
  const [candles, setCandles] = useState([]);
  const [candlesError, setCandlesError] = useState(null);
  const [loadingCandles, setLoadingCandles] = useState(true);

  const { items: allEvents } = usePolling("/api/events", "events", "classified_at");
  // allEvents is ascending (oldest first); reverse so the table below shows newest first.
  // Order doesn't matter for the chart markers, which just need the filtered set.
  const tickerEvents = useMemo(
    () => allEvents.filter((e) => e.ticker === ticker).reverse(),
    [allEvents, ticker]
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingCandles(true);

    function load() {
      fetch(`${API_BASE}/api/tickers/${ticker}/candles?range=${range}`)
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
    }

    load();
    const id = setInterval(load, CANDLE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ticker, range]);

  return (
    <>
      <Link to="/" className="back-link">&larr; Back to dashboard</Link>
      <div className="page-title-row">
        <h2 className="page-title">{ticker}</h2>
        <div className="range-selector">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={r.key === range ? "active" : ""}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {candlesError && <div className="error-banner">Failed to load price history: {candlesError}</div>}

      {loadingCandles && candles.length === 0 ? (
        <p className="page-note">Loading price history…</p>
      ) : (
        <PriceChart ticker={ticker} candles={candles} events={tickerEvents} range={range} />
      )}

      <table className="events-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Category</th>
            <th>Urgency</th>
            <th>Relevance</th>
            <th>Rationale</th>
            <th>Source</th>
            <th>Classified</th>
          </tr>
        </thead>
        <tbody>
          {tickerEvents.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty">No events yet for {ticker}.</td>
            </tr>
          ) : (
            tickerEvents.map((e) => (
              <tr key={e.id}>
                <td className="cell-muted">{e.type}</td>
                <td><StatusBadge value={e.category} status={CATEGORY_STATUS[e.category]} /></td>
                <td><StatusBadge value={e.urgency} status={URGENCY_STATUS[e.urgency]} /></td>
                <td className="cell-tabular">{e.relevance}</td>
                <td className="cell-rationale">{e.rationale}</td>
                <td><SourceLink event={e} /></td>
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
