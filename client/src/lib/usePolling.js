import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const POLL_INTERVAL_MS = 12000; // 10-15s per spec

// Polls `${API_BASE}${path}?since=<cursor>`, appending only-new items each tick.
// `listKey` is the array field in the response body; `sinceKey` is the field
// on each item used to advance the cursor (must be monotonically increasing).
export function usePolling(path, listKey, sinceKey) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastPolledAt, setLastPolledAt] = useState(null);

  const sinceRef = useRef(new Date(0).toISOString());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const url = `${API_BASE}${path}?since=${encodeURIComponent(sinceRef.current)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        const list = data[listKey];
        if (list.length > 0) {
          sinceRef.current = list[list.length - 1][sinceKey];
          setItems((prev) => [...list, ...prev].slice(0, 500));
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
