import { Router } from "express";
import { pool } from "../db/index.js";

export const statsRouter = Router();

// gpt-4o-mini pricing, USD per 1M tokens (https://openai.com/api/pricing).
const PRICE_PER_1M_INPUT = 0.15;
const PRICE_PER_1M_OUTPUT = 0.60;

const STATS_SQL = `
  SELECT
    count(*) AS total_classifications,
    coalesce(sum(prompt_tokens), 0) AS total_prompt_tokens,
    coalesce(sum(completion_tokens), 0) AS total_completion_tokens,
    coalesce(avg(latency_ms), 0) AS avg_latency_ms,
    coalesce(max(latency_ms), 0) AS max_latency_ms
  FROM classifications
`;

statsRouter.get("/stats", async (req, res) => {
  const { rows } = await pool.query(STATS_SQL);
  const row = rows[0];

  const promptTokens = Number(row.total_prompt_tokens);
  const completionTokens = Number(row.total_completion_tokens);
  const estimatedCostUsd =
    (promptTokens / 1_000_000) * PRICE_PER_1M_INPUT +
    (completionTokens / 1_000_000) * PRICE_PER_1M_OUTPUT;

  res.json({
    totalClassifications: Number(row.total_classifications),
    totalPromptTokens: promptTokens,
    totalCompletionTokens: completionTokens,
    avgLatencyMs: Math.round(Number(row.avg_latency_ms)),
    maxLatencyMs: Number(row.max_latency_ms),
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
    pricePer1mInput: PRICE_PER_1M_INPUT,
    pricePer1mOutput: PRICE_PER_1M_OUTPUT,
  });
});
