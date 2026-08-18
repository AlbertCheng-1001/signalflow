const BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

// Unofficial, undocumented Yahoo Finance endpoint - Finnhub's free tier blocks
// historical candles (403), and this requires no signup/API key. Same endpoint
// the `yfinance` Python library is built on. Supports intraday intervals (confirmed
// 5m works for range=1d, 15m works for range=5d).
export async function getCandles(symbol, range, interval) {
  const url = new URL(`${BASE_URL}/${symbol}`);
  url.searchParams.set("range", range);
  url.searchParams.set("interval", interval);

  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    throw new Error(`Yahoo Finance ${symbol} failed: ${res.status}`);
  }

  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error(`Yahoo Finance returned no data for ${symbol}`);
  }

  const { timestamp, indicators } = result;
  const closes = indicators.quote[0].close;

  return timestamp
    .map((ts, i) => ({
      t: new Date(ts * 1000).toISOString(),
      close: closes[i],
    }))
    .filter((candle) => candle.close != null);
}
