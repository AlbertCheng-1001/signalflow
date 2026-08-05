import { pool } from "../db/index.js";
import { WATCHLIST } from "../config/watchlist.js";
import { getQuote } from "./finnhub.js";

// Only record a price_move event if the day's percent change crosses this threshold.
const MOVE_THRESHOLD_PERCENT = 2;

const INSERT_SQL = `
  INSERT INTO raw_events (source_id, type, ticker, payload, occurred_at)
  VALUES ($1, 'price_move', $2, $3, $4)
  ON CONFLICT (source_id) DO NOTHING
`;

export async function pollQuotes() {
  let inserted = 0;

  for (const ticker of WATCHLIST) {
    let quote;
    try {
      quote = await getQuote(ticker);
    } catch (err) {
      console.error(`[pollQuotes] ${ticker} fetch failed:`, err.message);
      continue;
    }

    if (!quote.t || Math.abs(quote.dp) < MOVE_THRESHOLD_PERCENT) continue;

    // Dedupe on ticker + Finnhub's last-trade timestamp, so the same move isn't re-inserted every poll.
    const sourceId = `finnhub-quote-${ticker}-${quote.t}`;
    const occurredAt = new Date(quote.t * 1000).toISOString();
    const result = await pool.query(INSERT_SQL, [
      sourceId,
      ticker,
      JSON.stringify(quote),
      occurredAt,
    ]);
    inserted += result.rowCount;
  }

  if (inserted > 0) console.log(`[pollQuotes] inserted ${inserted} new event(s)`);
  return inserted;
}
