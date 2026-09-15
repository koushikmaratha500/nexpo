# Release 6.0 — Tines Story Inventory

> Ground Zero: create Tines tenant, credentials, and Stories from scratch. Export/runbook notes live in `infrastructure/tines/`.

---

## Story map

```text
[Inbound]
  STORY-01 whatsapp-inbound       OpenWA webhook → normalize
  STORY-02 telegram-inbound       grammY/Telegram webhook → normalize
  STORY-03 event-ingest           Core domain events

[Core workflow]
  STORY-10 bot-master             normalize → user → intent → confirm → command → reply
  STORY-11 account-link           unlinked user → link URL flow
  STORY-12 confirmation           pending txn → confirm/edit/cancel

[Sub-stories — reusable]
  SUB-01 call-command-api         HTTP POST /api/internal/bot/command
  SUB-02 format-whatsapp          BotResponse → WhatsApp text
  SUB-03 format-telegram          BotResponse → Telegram text + keyboard
  SUB-04 send-whatsapp            OpenWA REST outbound
  SUB-05 send-telegram            grammY/bot API outbound
  SUB-06 resolve-user             ChannelAccount lookup via Core API
  SUB-07 intent-deterministic     Regex + slash commands
  SUB-08 intent-ai                AI parse → structured command (Phase 10)
  SUB-09 error-handler            Map Core errors → user messages

[Automation — async]
  STORY-20 large-expense-alert    expense.created, amount > threshold
  STORY-21 daily-summary          Schedule 08:00 IST → Command API → push
  STORY-22 weekly-summary         Schedule Monday
  STORY-23 monthly-report         1st of month + AI narrative
  STORY-24 notification-router    notification.required → channel dispatch

[Future]
  STORY-30 budget-alert           expense.created + budget entity
  STORY-31 recurring-expense      Schedule → CREATE_EXPENSE
  STORY-32 group-expense          ADD_GROUP_EXPENSE workflow
```

---

## STORY-10 bot-master (sync)

**Trigger:** Webhook from STORY-01 or STORY-02

**Flow:**

1. Dedupe by `channel + message_id` (call Core idempotency or Tines memory).
2. SUB-06 resolve user → if null, run STORY-11.
3. SUB-07 intent; if unknown and AI enabled, SUB-08.
4. If mutation: STORY-12 confirmation unless auto-confirm disabled.
5. SUB-01 call Command API.
6. SUB-02 or SUB-03 format.
7. SUB-04 or SUB-05 send reply.
8. Emit internal log / optional `message.processed` back to Core.

**SLA target:** < 5s p95 for read commands; < 8s for writes with confirm.

---

## STORY-03 event-ingest

**Trigger:** Webhook from Core outbox dispatcher

**Routing:**

| event_type | Action |
|------------|--------|
| `expense.created` | Run STORY-20 if amount > threshold |
| `user.linked` | Welcome via SUB-04/SUB-05 |
| `notification.required` | STORY-24 |

---

## Credentials (Tines vault)

| Credential | Used by |
|------------|---------|
| `BOT_COMMAND_SECRET` | SUB-01 |
| `OPENWA_API_KEY` | SUB-04, STORY-01 verify |
| `OPENWA_WEBHOOK_SECRET` | HMAC validation |
| `TELEGRAM_BOT_TOKEN` | SUB-05 |
| `TINES_INGEST_SECRET` | STORY-03 webhook auth |

---

## Workflow-as-API (sync queries)

Expose STORY-10 (read-only branch) as Tines API for external callers if needed:

```text
POST https://<tenant>.tines.com/api/v1/workflows/bot-query
Body: { "channel", "external_user_id", "text" }
Response: { "reply_text", "success" }
```

Use for debugging and future mobile deep-links.

---

## Monitoring

- Tines action-level logs per Story run
- Alert on: STORY-01 failure rate, SUB-01 5xx, outbox lag > 5 min
- Dashboard: messages/day, commands/day, confirm rate, plan lock rate
