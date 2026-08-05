import { pool } from "../db/index.js";
import { WATCHLIST } from "../config/watchlist.js";
import { getCompanyNews } from "./finnhub.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const INSERT_SQL = `
  INSERT INTO raw_events (source_id, type, ticker, payload, occurred_at)
  VALUES ($1, 'news', $2, $3, $4)
  ON CONFLICT (source_id) DO NOTHING
`;

export async function pollNews() {
  const from = todayISO();
  const to = todayISO();
  let inserted = 0;

  for (const ticker of WATCHLIST) {
    let items;
    try {
      items = await getCompanyNews(ticker, from, to);
    } catch (err) {
      console.error(`[pollNews] ${ticker} fetch failed:`, err.message);
      continue;
    }

    for (const item of items) {
      const sourceId = `finnhub-news-${item.id}`;
      const occurredAt = new Date(item.datetime * 1000).toISOString();
      const result = await pool.query(INSERT_SQL, [
        sourceId,
        ticker,
        JSON.stringify(item),
        occurredAt,
      ]);
      inserted += result.rowCount;
    }
  }

  if (inserted > 0) console.log(`[pollNews] inserted ${inserted} new event(s)`);
  return inserted;
}
