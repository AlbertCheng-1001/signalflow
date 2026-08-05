import { useEffect, useMemo, useRef, useState } from "react";
import { WATCHLIST } from "./watchlist";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const POLL_INTERVAL_MS = 12000; // 10-15s per spec

function App() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [tickerFilter, setTickerFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Tracks the newest classified_at we've seen, so each poll only asks the
  // API for events after it (?since=<timestamp>).
  const sinceRef = useRef(new Date(0).toISOString());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const url = `${API_BASE}/api/events?since=${encodeURIComponent(sinceRef.current)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        if (data.events.length > 0) {
          sinceRef.current = data.events[data.events.length - 1].classified_at;
          setEvents((prev) => [...data.events, ...prev].slice(0, 500));
        }
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (tickerFilter !== "ALL" && e.ticker !== tickerFilter) return false;
      if (urgencyFilter !== "ALL" && e.urgency !== urgencyFilter) return false;
      if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
      return true;
    });
  }, [events, tickerFilter, urgencyFilter, typeFilter]);

  return (
    <div className="app">
      <header>
        <h1>SignalFlow</h1>
        <p className="subtitle">Real-time market event classification &amp; alerts</p>
      </header>

      <div className="filters">
        <label>
          Ticker
          <select value={tickerFilter} onChange={(e) => setTickerFilter(e.target.value)}>
            <option value="ALL">All</option>
            {WATCHLIST.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          Urgency
          <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="news">News</option>
            <option value="price_move">Price move</option>
          </select>
        </label>
      </div>

      {error && <div className="error-banner">Polling error: {error}</div>}

      <table className="events-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Type</th>
            <th>Category</th>
            <th>Urgency</th>
            <th>Relevance</th>
            <th>Rationale</th>
            <th>Classified at</th>
          </tr>
        </thead>
        <tbody>
          {filteredEvents.map((e) => (
            <tr key={e.id} className={`row-${e.category}`}>
              <td>{e.ticker}</td>
              <td>{e.type}</td>
              <td>{e.category}</td>
              <td>{e.urgency}</td>
              <td>{e.relevance}</td>
              <td>{e.rationale}</td>
              <td>{new Date(e.classified_at).toLocaleTimeString()}</td>
            </tr>
          ))}
          {filteredEvents.length === 0 && (
            <tr>
              <td colSpan={7} className="empty">No events yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
