# Release 6.0 — Domain Event Contract

> Events are **facts** emitted by PaySaSuchan Core after successful commits. Tines (and optionally Trigger.dev) consume them for orchestration — never for financial writes.

---

## Envelope (all events)

```json
{
  "event_id": "evt_550e8400-e29b-41d4-a716-446655440000",
  "event_type": "expense.created",
  "event_version": "1.0",
  "timestamp": "2026-09-09T09:00:00.000Z",
  "correlation_id": "corr_whatsapp_abc123",
  "source": "paysasuchan-core",
  "user_id": "usr_uuid",
  "data": {}
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `event_id` | Yes | UUID; unique per emission |
| `event_type` | Yes | Dot-notation; see catalog below |
| `event_version` | Yes | Semver string for schema evolution |
| `timestamp` | Yes | ISO-8601 UTC |
| `correlation_id` | Yes | Trace bot message → command → event |
| `source` | Yes | Always `paysasuchan-core` from Core |
| `user_id` | Usually | Subject user; omit only for system events |
| `data` | Yes | Type-specific payload |

---

## Event catalog (MVP)

### Transactions

| event_type | When | Tines use |
|------------|------|-----------|
| `expense.created` | DEBIT committed | Budget alert, large-txn, analytics, notify |
| `expense.updated` | DEBIT updated | Reconcile alerts |
| `expense.deleted` | DEBIT deleted | Analytics |
| `income.created` | CREDIT committed | Monthly summary, notify |
| `income.updated` | CREDIT updated | — |
| `income.deleted` | CREDIT deleted | — |

**`expense.created` data example:**

```json
{
  "transaction_id": "txn_uuid",
  "amount": "850.00",
  "currency": "INR",
  "category": "Food",
  "description": "Dinner",
  "merchant": null,
  "transaction_date": "2026-09-09",
  "payment_type": "UPI",
  "group_id": null,
  "channel": "whatsapp",
  "idempotency_key": "whatsapp:msg_abc"
}
```

### Identity

| event_type | When | Tines use |
|------------|------|-----------|
| `user.linked` | ChannelAccount activated | Welcome message |
| `user.unlinked` | Channel revoked | Cleanup session state |

### Bot / messaging

| event_type | When | Tines use |
|------------|------|-----------|
| `message.processed` | Command completed for inbound msg | Metrics |
| `message.failed` | Command failed | Retry / support alert |

### Notifications (Core → Tines)

| event_type | When | Tines use |
|------------|------|-----------|
| `notification.required` | Core requests delivery | Route to WA/TG/Email |

**`notification.required` data example:**

```json
{
  "channels": ["whatsapp", "email"],
  "template": "trial_expiring",
  "payload": {
    "days_left": 2
  }
}
```

---

## Command API request (Tines → Core)

`POST /api/internal/bot/command`

```json
{
  "command": "CREATE_EXPENSE",
  "user_id": "usr_uuid",
  "correlation_id": "corr_whatsapp_abc123",
  "idempotency_key": "whatsapp:msg_abc",
  "source_channel": "whatsapp",
  "payload": {
    "amount": 850,
    "currency": "INR",
    "category": "Food",
    "description": "Dinner",
    "transaction_date": "2026-09-09"
  }
}
```

**Response (success):**

```json
{
  "success": true,
  "type": "expense_created",
  "transaction_id": "txn_uuid",
  "display": {
    "amount": "₹850",
    "category": "Food",
    "description": "Dinner",
    "date_label": "Today"
  }
}
```

**Response (plan locked):**

```json
{
  "success": false,
  "error_code": "PLAN_WRITE_LOCKED",
  "message": "Your trial has ended. Upgrade to continue adding transactions."
}
```

---

## Canonical inbound message (Channel → Tines)

```json
{
  "channel": "whatsapp",
  "external_user_id": "919876543210",
  "message_id": "msg_abc",
  "message_type": "text",
  "text": "spent 500 on lunch",
  "timestamp": "2026-09-09T09:00:00Z",
  "raw": {}
}
```

---

## Delivery mechanics

1. Core writes transaction + `DomainEventOutbox` row in same DB transaction.
2. Outbox dispatcher (Trigger.dev task or Next.js cron) POSTs to Tines webhook URL.
3. Tines returns 2xx → mark outbox `delivered_at`.
4. Failures: exponential retry; alert after N attempts.

**Auth:** `Authorization: Bearer <TINES_INGEST_SECRET>` or HMAC signature on body.

---

## Versioning

- Breaking changes: increment `event_version`; Tines Stories branch on version.
- Additive fields: same version; consumers ignore unknown keys.
