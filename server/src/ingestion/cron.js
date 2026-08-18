import cron from "node-cron";
import { isMarketHours, isNewsHours } from "../config/marketHours.js";
import { pollNews } from "./pollNews.js";
import { pollQuotes } from "./pollQuotes.js";
import { classifyPendingEvents } from "../classification/classify.js";

export function startCronJobs() {
  // Quotes: every minute, regular market hours only - Finnhub's free quote
  // endpoint is frozen outside this window, so polling wider would be wasted calls.
  cron.schedule("* * * * *", async () => {
    if (!isMarketHours()) return;
    try {
      await pollQuotes();
    } catch (err) {
      console.error("[cron] pollQuotes error:", err);
    }
  });

  // News: every 5 minutes, extended hours (4am-10pm ET) - catches pre-market and
  // after-hours earnings releases that the narrower market-hours window would miss.
  cron.schedule("*/5 * * * *", async () => {
    if (!isNewsHours()) return;
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
