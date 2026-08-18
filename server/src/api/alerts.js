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

// GET /api/alerts?since=<ISO timestamp>
alertsRouter.get("/alerts", async (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : new Date(0);
  if (Number.isNaN(since.getTime())) {
    return res.status(400).json({ error: "invalid 'since' timestamp" });
  }

  const { rows } = await pool.query(SELECT_SINCE_SQL, [since.toISOString()]);
  res.json({ alerts: rows, asOf: new Date().toISOString() });
});
