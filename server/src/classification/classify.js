import OpenAI from "openai";
import { pool } from "../db/index.js";
import { sendEscalationAlert } from "../alerting/ses.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BATCH_SIZE = 10;

const SELECT_UNCLASSIFIED_SQL = `
  SELECT re.id, re.type, re.ticker, re.payload, re.occurred_at
  FROM raw_events re
  LEFT JOIN classifications c ON c.raw_event_id = re.id
  WHERE c.id IS NULL
  ORDER BY re.occurred_at ASC
  LIMIT $1
`;

const INSERT_CLASSIFICATION_SQL = `
  INSERT INTO classifications
    (raw_event_id, relevance, urgency, category, rationale, prompt_tokens, completion_tokens, latency_ms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING id
`;

const SYSTEM_PROMPT = `You are a market event triage assistant for an active trader's watchlist.
Given a single market event (news headline or price move), assess it and respond with JSON only:
{
  "relevance": <integer 0-100, how relevant/material this is to the ticker>,
  "urgency": "low" | "medium" | "high",
  "category": "ignore" | "alert" | "escalate",
  "rationale": "<one sentence explanation>"
}
Guidance:
- "escalate": high-urgency, material events a trader needs to see immediately (earnings surprises, M&A, guidance changes, large abnormal price moves, regulatory/legal action).
- "alert": relevant but not urgent enough to page someone immediately.
- "ignore": routine or immaterial noise.`;

function eventToPrompt(event) {
  if (event.type === "news") {
    const { headline, summary, source } = event.payload;
    return `Ticker: ${event.ticker}\nType: news\nHeadline: ${headline}\nSummary: ${summary ?? "(none)"}\nSource: ${source ?? "unknown"}`;
  }
  const { c, dp, o } = event.payload;
  return `Ticker: ${event.ticker}\nType: price_move\nOpen: ${o}\nCurrent: ${c}\nPercent change: ${dp}%`;
}

async function classifyEvent(event) {
  const startedAt = Date.now();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: eventToPrompt(event) },
    ],
  });
  const latencyMs = Date.now() - startedAt;

  const parsed = JSON.parse(completion.choices[0].message.content);
  return {
    relevance: Math.max(0, Math.min(100, Math.round(parsed.relevance))),
    urgency: parsed.urgency,
    category: parsed.category,
    rationale: parsed.rationale ?? null,
    promptTokens: completion.usage?.prompt_tokens ?? null,
    completionTokens: completion.usage?.completion_tokens ?? null,
    latencyMs,
  };
}

export async function classifyPendingEvents() {
  const { rows: events } = await pool.query(SELECT_UNCLASSIFIED_SQL, [BATCH_SIZE]);
  let classified = 0;

  for (const event of events) {
    let result;
    try {
      result = await classifyEvent(event);
    } catch (err) {
      console.error(`[classify] event ${event.id} failed:`, err.message);
      continue;
    }

    const { rows } = await pool.query(INSERT_CLASSIFICATION_SQL, [
      event.id,
      result.relevance,
      result.urgency,
      result.category,
      result.rationale,
      result.promptTokens,
      result.completionTokens,
      result.latencyMs,
    ]);
    classified += 1;

    if (result.category === "escalate") {
      const classificationId = rows[0].id;
      await sendEscalationAlert({ classificationId, event, classification: result });
    }
  }

  if (classified > 0) console.log(`[classify] classified ${classified} event(s)`);
  return classified;
}
