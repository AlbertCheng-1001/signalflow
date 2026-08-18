import { Router } from "express";
import { getDailyCandles } from "../ingestion/yahooFinance.js";
import { WATCHLIST } from "../config/watchlist.js";

export const candlesRouter = Router();

// GET /api/tickers/:ticker/candles?range=3mo
candlesRouter.get("/tickers/:ticker/candles", async (req, res) => {
  const { ticker } = req.params;
  if (!WATCHLIST.includes(ticker)) {
    return res.status(404).json({ error: "unknown ticker" });
  }

  const range = req.query.range || "3mo";
  try {
    const candles = await getDailyCandles(ticker, range);
    res.json({ ticker, candles });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});
