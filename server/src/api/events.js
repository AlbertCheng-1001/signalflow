import { Router } from "express";
import { pool } from "../db/index.js";

export const eventsRouter = Router();

const SELECT_SINCE_SQL = `
  SELECT
    re.id, re.type, re.ticker, re.payload, re.occurred_at,
    c.relevance, c.urgency, c.category, c.rationale, c.classified_at
  FROM raw_events re
  JOIN classifications c ON c.raw_event_id = re.id
  WHERE c.classified_at > $1
  ORDER BY c.classified_at ASC
  LIMIT 200
`;

// Same shape/order as SELECT_SINCE_SQL (ascending), but for "no cursor yet" -
// the most recent 200 rows, oldest-of-that-set first. Without this, a first
// load with no `since` would fall back to "everything after epoch" ordered
// ASC, which returns the 200 OLDEST rows ever recorded instead of the newest.
const SELECT_LATEST_SQL = `
  SELECT * FROM (
    SELECT
      re.id, re.type, re.ticker, re.payload, re.occurred_at,
      c.relevance, c.urgency, c.category, c.rationale, c.classified_at
    FROM raw_events re
    JOIN classifications c ON c.raw_event_id = re.id
    ORDER BY c.classified_at DESC
    LIMIT 200
  ) recent
  ORDER BY classified_at ASC
`;

// GET /api/events?since=<ISO timestamp>
// Omit `since` to get the latest 200; pass it to get only what's new since that cursor.
eventsRouter.get("/events", async (req, res) => {
  if (!req.query.since) {
    const { rows } = await pool.query(SELECT_LATEST_SQL);
    return res.json({ events: rows, asOf: new Date().toISOString() });
  }

  const since = new Date(req.query.since);
  if (Number.isNaN(since.getTime())) {
    return res.status(400).json({ error: "invalid 'since' timestamp" });
  }

  const { rows } = await pool.query(SELECT_SINCE_SQL, [since.toISOString()]);
  res.json({ events: rows, asOf: new Date().toISOString() });
});
