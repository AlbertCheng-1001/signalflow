import { Router } from "express";
import { pool } from "../db/index.js";
import { requireAuth } from "../auth/middleware.js";
import { WATCHLIST } from "../config/watchlist.js";

export const favoritesRouter = Router();

const SELECT_FAVORITES_SQL = `
  SELECT ticker FROM favorites WHERE user_id = $1 ORDER BY created_at ASC
`;

const INSERT_FAVORITE_SQL = `
  INSERT INTO favorites (user_id, ticker) VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

const DELETE_FAVORITE_SQL = `
  DELETE FROM favorites WHERE user_id = $1 AND ticker = $2
`;

favoritesRouter.get("/favorites", requireAuth, async (req, res) => {
  const { rows } = await pool.query(SELECT_FAVORITES_SQL, [req.userId]);
  res.json({ tickers: rows.map((r) => r.ticker) });
});

favoritesRouter.post("/favorites", requireAuth, async (req, res) => {
  const { ticker } = req.body ?? {};
  if (!WATCHLIST.includes(ticker)) {
    return res.status(400).json({ error: "ticker is not in the watchlist" });
  }
  await pool.query(INSERT_FAVORITE_SQL, [req.userId, ticker]);
  res.status(201).json({ ok: true });
});

favoritesRouter.delete("/favorites/:ticker", requireAuth, async (req, res) => {
  await pool.query(DELETE_FAVORITE_SQL, [req.userId, req.params.ticker]);
  res.json({ ok: true });
});
