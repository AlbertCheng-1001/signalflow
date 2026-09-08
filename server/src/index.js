import "dotenv/config";
import express from "express";
import cors from "cors";
import { eventsRouter } from "./api/events.js";
import { alertsRouter } from "./api/alerts.js";
import { statsRouter } from "./api/stats.js";
import { candlesRouter } from "./api/candles.js";
import { authRouter } from "./api/auth.js";
import { favoritesRouter } from "./api/favorites.js";
import { startCronJobs } from "./ingestion/cron.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", eventsRouter);
app.use("/api", alertsRouter);
app.use("/api", statsRouter);
app.use("/api", candlesRouter);
app.use("/api", authRouter);
app.use("/api", favoritesRouter);

app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`SignalFlow server listening on port ${port}`);
  startCronJobs();
});
