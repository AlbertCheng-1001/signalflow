export const CATEGORY_STATUS = { ignore: "good", alert: "warning", escalate: "critical" };
export const URGENCY_STATUS = { low: "good", medium: "warning", high: "critical" };

export function StatusBadge({ value, status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" aria-hidden="true" />
      {value}
    </span>
  );
}
