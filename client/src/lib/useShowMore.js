import { useEffect, useState } from "react";

const PAGE_SIZE = 25;

// Caps rendering to `count` items, growing by PAGE_SIZE on demand. `resetKey`
// identifies what the visible set is filtered/scoped by (e.g. active filters) —
// count resets to PAGE_SIZE only when it changes, not on every poll tick, so
// "load more" isn't undone by new data arriving.
export function useShowMore(items, resetKey) {
  const [count, setCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setCount(PAGE_SIZE);
  }, [resetKey]);

  return {
    visible: items.slice(0, count),
    hasMore: count < items.length,
    showMore: () => setCount((c) => c + PAGE_SIZE),
  };
}
