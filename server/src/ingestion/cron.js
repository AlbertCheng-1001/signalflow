import cron from "node-cron";
import { isMarketHours } from "../config/marketHours.js";
import { pollNews } from "./pollNews.js";
import { pollQuotes } from "./pollQuotes.js";
import { classifyPendingEvents } from "../classification/classify.js";

export function startCronJobs() {
  // Quotes: every minute during market hours.
  cron.schedule("* * * * *", async () => {
    if (!isMarketHours()) return;
    try {
      await pollQuotes();
    } catch (err) {
      console.error("[cron] pollQuotes error:", err);
    }
  });

  // News: every 5 minutes during market hours.
  cron.schedule("*/5 * * * *", async () => {
    if (!isMarketHours()) return;
    try {
      await pollNews();
    } catch (err) {
      console.error("[cron] pollNews error:", err);
    }
  });

  // Classification: every minute, picks up whatever ingestion has queued.
  cron.schedule("* * * * *", async () => {
    try {
      await classifyPendingEvents();
    } catch (err) {
      console.error("[cron] classifyPendingEvents error:", err);
    }
  });

  console.log("Cron jobs scheduled (market-hours gated ingestion + continuous classification).");
}
