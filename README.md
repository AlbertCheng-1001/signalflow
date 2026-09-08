# SignalFlow

Real-time market event classification & alert engine. Polls market news and price moves for a fixed watchlist, classifies each event's relevance and urgency with OpenAI (`gpt-4o-mini`), and sends email alerts on escalated events.

**Live: [signalflow.ink](https://signalflow.ink)**

## Features

- Market-hours-gated ingestion (Finnhub) — quotes poll during regular trading hours, news polls extended hours, to stay within free-tier API limits
- Zero-shot event classification (relevance, urgency, category, rationale) via OpenAI, no fine-tuning or training data
- Semantic near-duplicate detection — embeds each news item and suppresses re-classification of the same underlying story covered by multiple outlets, via cosine similarity against recent same-ticker news
- Escalation alerts sent by email (Amazon SES) with idempotency guarantees (no duplicate sends for the same classification)
- Live cost/latency observability — tracks OpenAI token usage, per-call latency, and estimated spend, plus savings from deduplication
- Per-ticker intraday/historical price charts with classified-event markers
- Dashboard, alert history, and per-ticker views, filterable by ticker/urgency/type, polling for live updates

## Stack

- **Backend**: Node.js / Express, `node-cron`, PostgreSQL (AWS RDS)
- **Classification**: OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`)
- **Alerting**: Amazon SES
- **Frontend**: React (Vite), served via S3 + CloudFront
- **Infra**: AWS EC2 (backend, via PM2 + Nginx + Let's Encrypt), AWS RDS (PostgreSQL), S3 + CloudFront (frontend), Route DNS via Cloudflare

## Structure

```
/server   Express backend — ingestion, classification, alerting, API
/client   React frontend
```

## Local development

```
# server/.env and client/.env.production.local need real API keys — see server/src/config for required vars
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```
