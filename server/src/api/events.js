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

// GET /api/events?since=<ISO timestamp>
eventsRouter.get("/events", async (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : new Date(0);
  if (Number.isNaN(since.getTime())) {
    return res.status(400).json({ error: "invalid 'since' timestamp" });
  }

  const { rows } = await pool.query(SELECT_SINCE_SQL, [since.toISOString()]);
  res.json({ events: rows, asOf: new Date().toISOString() });
});
