import { useMemo } from "react";
import { usePolling } from "../lib/usePolling";
import { useShowMore } from "../lib/useShowMore";
import { timeAgo } from "../lib/time";
import { StatusBadge, URGENCY_STATUS } from "../components/StatusBadge";
import { StatTile } from "../components/StatTile";
import { SourceLink } from "../components/SourceLink";

export function Alerts() {
  const { items: rawAlerts, error, loading } = usePolling("/api/alerts", "alerts", "sent_at");
  // rawAlerts is ascending (oldest first); reverse so the newest shows at the top.
  const alerts = useMemo(() => [...rawAlerts].reverse(), [rawAlerts]);
  const { visible, hasMore, showMore } = useShowMore(alerts, "alerts");

  return (
    <>
      <div className="stat-tiles">
        <StatTile label="Alerts sent" value={alerts.length} status={alerts.length > 0 ? "critical" : undefined} />
      </div>

      <p className="page-note">
        Every row here is a real SES email, sent once per escalated classification —
        the <code>alerts_sent</code> table's unique constraint on <code>classification_id</code>{" "}
        guarantees no classification ever fires twice.
      </p>

      {error && <div className="error-banner">Polling error: {error}</div>}

      <div className="table-card">
        <table className="events-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Type</th>
              <th>Urgency</th>
              <th className="col-numeric">Relevance</th>
              <th>Rationale</th>
              <th>Source</th>
              <th>Recipient</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty">Loading alerts…</td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty">
                  No alerts sent yet — escalations trigger an email automatically.
                </td>
              </tr>
            ) : (
              visible.map((a) => (
                <tr key={a.id}>
                  <td className="cell-ticker">{a.ticker}</td>
                  <td className="cell-muted">{a.type}</td>
                  <td><StatusBadge value={a.urgency} status={URGENCY_STATUS[a.urgency]} /></td>
                  <td className="cell-tabular col-numeric">{a.relevance}</td>
                  <td className="cell-rationale">{a.rationale}</td>
                  <td><SourceLink event={a} /></td>
                  <td className="cell-muted">{a.recipient}</td>
                  <td className="cell-muted" title={new Date(a.sent_at).toLocaleString()}>
                    {timeAgo(a.sent_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {hasMore && (
          <button type="button" className="load-more" onClick={showMore}>
            Show more
          </button>
        )}
      </div>
    </>
  );
}
