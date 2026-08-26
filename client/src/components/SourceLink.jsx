// News events carry the original Finnhub article's url + outlet name in their
// payload; price moves have no source article to link to.
export function SourceLink({ event }) {
  if (event.type !== "news" || !event.payload?.url) {
    return <span className="cell-muted">—</span>;
  }

  return (
    <a href={event.payload.url} target="_blank" rel="noopener noreferrer" className="source-link">
      {event.payload.source || "Source"} <span aria-hidden="true">↗</span>
    </a>
  );
}
