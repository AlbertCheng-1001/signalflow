import { Router } from "express";
import { pool } from "../db/index.js";

export const alertsRouter = Router();

const SELECT_SINCE_SQL = `
  SELECT
    a.id, a.recipient, a.sent_at,
    re.ticker, re.type, re.payload, re.occurred_at,
    c.relevance, c.urgency, c.category, c.rationale
  FROM alerts_sent a
  JOIN classifications c ON c.id = a.classification_id
  JOIN raw_events re ON re.id = c.raw_event_id
  WHERE a.sent_at > $1
  ORDER BY a.sent_at ASC
  LIMIT 200
`;

// Same shape/order as SELECT_SINCE_SQL, but for "no cursor yet" - see events.js
// for why this is needed instead of defaulting to "everything after epoch".
const SELECT_LATEST_SQL = `
  SELECT * FROM (
    SELECT
      a.id, a.recipient, a.sent_at,
      re.ticker, re.type, re.payload, re.occurred_at,
      c.relevance, c.urgency, c.category, c.rationale
    FROM alerts_sent a
    JOIN classifications c ON c.id = a.classification_id
    JOIN raw_events re ON re.id = c.raw_event_id
    ORDER BY a.sent_at DESC
    LIMIT 200
  ) recent
  ORDER BY sent_at ASC
`;

// GET /api/alerts?since=<ISO timestamp>
// Omit `since` to get the latest 200; pass it to get only what's new since that cursor.
alertsRouter.get("/alerts", async (req, res) => {
  if (!req.query.since) {
    const { rows } = await pool.query(SELECT_LATEST_SQL);
    return res.json({ alerts: rows, asOf: new Date().toISOString() });
  }

  const since = new Date(req.query.since);
  if (Number.isNaN(since.getTime())) {
    return res.status(400).json({ error: "invalid 'since' timestamp" });
  }

  const { rows } = await pool.query(SELECT_SINCE_SQL, [since.toISOString()]);
  res.json({ alerts: rows, asOf: new Date().toISOString() });
});
