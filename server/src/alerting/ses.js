import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { pool } from "../db/index.js";

const ses = new SESClient({ region: process.env.AWS_REGION });

// Reserve the alert via the alerts_sent unique constraint before sending, so a
// classification can never trigger two emails (e.g. if the cron tick overlaps).
const RESERVE_SQL = `
  INSERT INTO alerts_sent (classification_id, recipient)
  VALUES ($1, $2)
  ON CONFLICT (classification_id) DO NOTHING
  RETURNING id
`;

function buildEmail({ event, classification }) {
  const subject = `[SignalFlow] ESCALATE ${event.ticker} — ${classification.urgency.toUpperCase()} urgency`;
  const body = [
    `Ticker: ${event.ticker}`,
    `Type: ${event.type}`,
    `Relevance: ${classification.relevance}/100`,
    `Urgency: ${classification.urgency}`,
    `Rationale: ${classification.rationale ?? "(none)"}`,
    "",
    `Raw event: ${JSON.stringify(event.payload, null, 2)}`,
  ].join("\n");
  return { subject, body };
}

export async function sendEscalationAlert({ classificationId, event, classification }) {
  const recipient = process.env.SES_TO_EMAIL;
  const { rows } = await pool.query(RESERVE_SQL, [classificationId, recipient]);

  if (rows.length === 0) {
    // Already sent for this classification; nothing to do.
    return;
  }

  const { subject, body } = buildEmail({ event, classification });

  try {
    await ses.send(
      new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL,
        Destination: { ToAddresses: [recipient] },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: body } },
        },
      })
    );
    console.log(`[alerting] sent escalation email for classification ${classificationId}`);
  } catch (err) {
    console.error(`[alerting] SES send failed for classification ${classificationId}:`, err.message);
  }
}
