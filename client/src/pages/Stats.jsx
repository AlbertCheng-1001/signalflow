import { useEffect, useState } from "react";
import { StatTile } from "../components/StatTile";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const POLL_INTERVAL_MS = 12000;

function formatTokens(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
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

  return (
    <>
      <p className="page-note">
        Live cost and latency tracking for every OpenAI (<code>gpt-4o-mini</code>) classification
        call — priced at ${stats ? stats.pricePer1mInput.toFixed(2) : "0.15"}/1M input tokens and
        ${stats ? stats.pricePer1mOutput.toFixed(2) : "0.60"}/1M output tokens.
      </p>

      {error && <div className="error-banner">Failed to load stats: {error}</div>}

      {stats && (
        <>
          <div className="stat-tiles">
            <StatTile label="Total classifications" value={stats.totalClassifications.toLocaleString()} />
            <StatTile label="Estimated total cost" value={`$${stats.estimatedCostUsd.toFixed(4)}`} />
            <StatTile label="Avg latency" value={`${stats.avgLatencyMs.toLocaleString()}ms`} />
            <StatTile label="Max latency" value={`${stats.maxLatencyMs.toLocaleString()}ms`} />
          </div>
          <div className="stat-tiles">
            <StatTile label="Prompt tokens" value={formatTokens(stats.totalPromptTokens)} />
            <StatTile label="Completion tokens" value={formatTokens(stats.totalCompletionTokens)} />
            <StatTile
              label="Total tokens"
              value={formatTokens(stats.totalPromptTokens + stats.totalCompletionTokens)}
            />
            <StatTile
              label="Avg cost / classification"
              value={
                stats.totalClassifications > 0
                  ? `$${(stats.estimatedCostUsd / stats.totalClassifications).toFixed(6)}`
                  : "$0"
              }
            />
          </div>
          <div className="stat-tiles">
            <StatTile label="Duplicates suppressed" value={stats.duplicatesSuppressed} status="good" />
            <StatTile label="Est. savings from dedup" value={`$${stats.estimatedSavingsUsd.toFixed(4)}`} status="good" />
          </div>
          <p className="page-note">
            Near-duplicate news (multiple outlets covering the same underlying event) is detected
            via OpenAI embeddings + cosine similarity against recent same-ticker news, and
            excluded from classification entirely rather than triggering a separate alert.
          </p>
        </>
      )}
    </>
  );
}
