# SignalFlow

Real-time market event classification & alert engine. Ingests market events (news + price moves) for a fixed watchlist, classifies them with OpenAI (`gpt-4o-mini`) for relevance/urgency, and sends email alerts on escalated events.

## Stack

- **Backend**: Node.js / Express, `node-cron`, PostgreSQL (AWS RDS)
- **Classification**: OpenAI API
- **Alerting**: Amazon SES
- **Frontend**: React (static build, served via S3 + CloudFront)
- **Deploy**: AWS EC2 + PM2 (backend)

## Structure

```
/server   Express backend — ingestion, classification, alerting, API
/client   React frontend
```

## Status

Work in progress — see commit history. Backend scaffold in progress; frontend not started yet.
