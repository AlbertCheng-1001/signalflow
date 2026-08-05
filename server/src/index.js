import "dotenv/config";
import express from "express";
import cors from "cors";
import { eventsRouter } from "./api/events.js";
import { startCronJobs } from "./ingestion/cron.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", eventsRouter);

app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`SignalFlow server listening on port ${port}`);
  startCronJobs();
});
