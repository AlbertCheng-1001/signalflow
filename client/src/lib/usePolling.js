import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const POLL_INTERVAL_MS = 12000; // 10-15s per spec

// Polls `${API_BASE}${path}`, keeping `items` in ascending chronological order
// (oldest first, newest last), capped to the most recent 500. The first call
// omits `since` entirely so the API returns the latest 200 rather than
// crawling forward from epoch (which, with a large accumulated backlog, could
// take a very long time to reach "now"). `listKey` is the array field in the
// response body; `sinceKey` is the field on each item used to advance the
// cursor (must be monotonically increasing).
export function usePolling(path, listKey, sinceKey) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastPolledAt, setLastPolledAt] = useState(null);

  const sinceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const url = sinceRef.current
          ? `${API_BASE}${path}?since=${encodeURIComponent(sinceRef.current)}`
          : `${API_BASE}${path}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        const list = data[listKey];
        if (list.length > 0) {
          sinceRef.current = list[list.length - 1][sinceKey];
          setItems((prev) => [...prev, ...list].slice(-500));
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
  }, [path, listKey, sinceKey]);

  return { items, error, loading, lastPolledAt };
}
