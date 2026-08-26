import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { WATCHLIST } from "../watchlist";
import { usePolling } from "../lib/usePolling";
import { timeAgo } from "../lib/time";
import { StatusBadge, CATEGORY_STATUS, URGENCY_STATUS } from "../components/StatusBadge";
import { StatTile } from "../components/StatTile";
import { SourceLink } from "../components/SourceLink";

export function Dashboard() {
  const { items: events, error, loading } = usePolling("/api/events", "events", "classified_at");

  const [tickerFilter, setTickerFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredEvents = useMemo(() => {
    // events is ascending (oldest first); reverse so the newest shows at the top.
    return events
      .filter((e) => {
        if (tickerFilter !== "ALL" && e.ticker !== tickerFilter) return false;
        if (urgencyFilter !== "ALL" && e.urgency !== urgencyFilter) return false;
        if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
        return true;
      })
      .reverse();
  }, [events, tickerFilter, urgencyFilter, typeFilter]);

  const counts = useMemo(() => {
    const result = { total: events.length, escalate: 0, alert: 0, ignore: 0 };
    for (const e of events) result[e.category] = (result[e.category] ?? 0) + 1;
    return result;
  }, [events]);

  return (
    <>
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
            <th>Source</th>
            <th>Classified</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="empty">Loading events…</td>
            </tr>
          ) : filteredEvents.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty">
                {events.length === 0 ? "No events yet — waiting for market activity." : "No events match the current filters."}
              </td>
            </tr>
          ) : (
            filteredEvents.map((e) => (
              <tr key={e.id}>
                <td className="cell-ticker">
                  <Link to={`/ticker/${e.ticker}`}>{e.ticker}</Link>
                </td>
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
