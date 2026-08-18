export function StatTile({ label, value, status }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${status ? ` stat-value-${status}` : ""}`}>{value}</span>
    </div>
  );
}
