# Tines Story — SMS Batch Parse (Release 6.1)

## Trigger

Nexpo `POST` to `SMS_TINES_WEBHOOK_URL` after mobile uploads a batch via `POST /api/user/sms/sync`.

### Payload

```json
{
  "event": "sms.batch.received",
  "user_id": "uuid",
  "sync_batch_id": "uuid",
  "channel": "sms",
  "items": [
    {
      "message_id": "uuid",
      "message_hash": "sha256",
      "sender": "VK-HDFCBK",
      "body": "Rs 500 debited from A/c ...",
      "received_at": "2026-09-22T08:00:00.000Z",
      "idempotency_key": "sms:{userId}:{messageHash}"
    }
  ]
}
```

## Story flow

```text
1. Webhook Trigger       ← Nexpo sms.batch.received
2. Loop items            ← For each SMS in batch
3. AI Agent              ← Parse bank SMS (see tines-sms-ai-prompt.md)
4. HTTP Request          ← POST https://paysasuchan.com/api/webhooks/tines-bridge
       channel: sms
       user_id: <from batch>
       idempotency_key: sms:{userId}:{messageHash}
       ai_parse: { intent, amount, type, merchant, category, transaction_date, ... }
5. (Optional) Aggregate  ← Count parsed / skipped per batch for observability
```

## Auth

- Nexpo → Tines: `Authorization: Bearer ${SMS_TINES_WEBHOOK_SECRET}`
- Tines → Nexpo: `Authorization: Bearer ${TINES_BRIDGE_SECRET}`

## Idempotency

- Use `idempotency_key` exactly as provided (`sms:{userId}:{messageHash}`)
- Nexpo `BotRequest` + `SmsIngestMessage` prevent duplicate transactions

## SKIP handling

When AI returns `intent: "SKIP"` (OTP, promo, balance-only), bridge marks message `SKIPPED` — no transaction created.
