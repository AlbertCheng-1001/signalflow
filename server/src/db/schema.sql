-- raw_events: ingested from Finnhub (company news + price moves), deduped on source_id
CREATE TABLE IF NOT EXISTS raw_events (
  id           SERIAL PRIMARY KEY,
  source_id    TEXT NOT NULL UNIQUE,
  type         TEXT NOT NULL CHECK (type IN ('news', 'price_move')),
  ticker       TEXT NOT NULL,
  payload      JSONB NOT NULL,
  occurred_at  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_events_ticker ON raw_events (ticker);
CREATE INDEX IF NOT EXISTS idx_raw_events_created_at ON raw_events (created_at);

-- classifications: one OpenAI classification result per raw_event
CREATE TABLE IF NOT EXISTS classifications (
  id             SERIAL PRIMARY KEY,
  raw_event_id   INTEGER NOT NULL UNIQUE REFERENCES raw_events (id) ON DELETE CASCADE,
  relevance      INTEGER NOT NULL CHECK (relevance BETWEEN 0 AND 100),
  urgency        TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
  category       TEXT NOT NULL CHECK (category IN ('alert', 'ignore', 'escalate')),
  rationale      TEXT,
  classified_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE classifications ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER;
ALTER TABLE classifications ADD COLUMN IF NOT EXISTS completion_tokens INTEGER;
ALTER TABLE classifications ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

CREATE INDEX IF NOT EXISTS idx_classifications_classified_at ON classifications (classified_at);

-- alerts_sent: idempotency guard so an escalated classification only ever triggers one SES email
CREATE TABLE IF NOT EXISTS alerts_sent (
  id                 SERIAL PRIMARY KEY,
  classification_id  INTEGER NOT NULL UNIQUE REFERENCES classifications (id) ON DELETE CASCADE,
  recipient          TEXT NOT NULL,
  sent_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
