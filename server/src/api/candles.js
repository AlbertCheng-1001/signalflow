import { Router } from "express";
import { getCandles } from "../ingestion/yahooFinance.js";
import { WATCHLIST } from "../config/watchlist.js";

export const candlesRouter = Router();

// Yahoo has no native "3 day" range, so 3d/1w both pull the 5-day intraday series;
// 3d additionally slices down to the most recent 3 trading days present in it.
const RANGE_PRESETS = {
  "1d": { range: "1d", interval: "5m" },
  "3d": { range: "5d", interval: "15m", tradingDays: 3 },
  "1w": { range: "5d", interval: "15m" },
  "1mo": { range: "1mo", interval: "1d" },
};

function filterToLastNTradingDays(candles, n) {
  const days = [...new Set(candles.map((c) => c.t.slice(0, 10)))].sort();
  const keepDays = new Set(days.slice(-n));
  return candles.filter((c) => keepDays.has(c.t.slice(0, 10)));
}

// GET /api/tickers/:ticker/candles?range=1d|3d|1w|1mo
candlesRouter.get("/tickers/:ticker/candles", async (req, res) => {
  const { ticker } = req.params;
  if (!WATCHLIST.includes(ticker)) {
    return res.status(404).json({ error: "unknown ticker" });
  }

  const rangeKey = req.query.range || "1w";
  const preset = RANGE_PRESETS[rangeKey];
  if (!preset) {
    return res.status(400).json({ error: `invalid range, expected one of: ${Object.keys(RANGE_PRESETS).join(", ")}` });
  }

  try {
    let candles = await getCandles(ticker, preset.range, preset.interval);
    if (preset.tradingDays) {
      candles = filterToLastNTradingDays(candles, preset.tradingDays);
    }
    res.json({ ticker, range: rangeKey, candles });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});
