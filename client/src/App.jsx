import { useEffect, useMemo, useRef, useState } from "react";
import { WATCHLIST } from "./watchlist";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const POLL_INTERVAL_MS = 12000; // 10-15s per spec

const CATEGORY_STATUS = { ignore: "good", alert: "warning", escalate: "critical" };
const URGENCY_STATUS = { low: "good", medium: "warning", high: "critical" };

function StatusBadge({ value, status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" aria-hidden="true" />
      {value}
    </span>
  );
}

function timeAgo(isoString) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function StatTile({ label, value, status }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${status ? ` stat-value-${status}` : ""}`}>{value}</span>
    </div>
  );
}

function App() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastPolledAt, setLastPolledAt] = useState(null);
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
        setLastPolledAt(new Date());
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
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

  const counts = useMemo(() => {
    const result = { total: events.length, escalate: 0, alert: 0, ignore: 0 };
    for (const e of events) result[e.category] = (result[e.category] ?? 0) + 1;
    return result;
  }, [events]);

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <h1>SignalFlow</h1>
          <span className="live-indicator" title={lastPolledAt ? `Last polled ${lastPolledAt.toLocaleTimeString()}` : "Polling..."}>
            <span className="live-dot" aria-hidden="true" />
            Live
          </span>
        </div>
        <p className="subtitle">Real-time market event classification &amp; alerts</p>
      </header>

      <div className="stat-tiles">
        <StatTile label="Total events" value={counts.total} />
        <StatTile label="Escalate" value={counts.escalate} status="critical" />
        <StatTile label="Alert" value={counts.alert} status="warning" />
        <StatTile label="Ignore" value={counts.ignore} status="good" />
      </div>

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
            <th>Classified</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="empty">Loading events…</td>
            </tr>
          ) : filteredEvents.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty">
                {events.length === 0 ? "No events yet — waiting for market activity." : "No events match the current filters."}
              </td>
            </tr>
          ) : (
            filteredEvents.map((e) => (
              <tr key={e.id}>
                <td className="cell-ticker">{e.ticker}</td>
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
    </div>
  );
}

export default App;
