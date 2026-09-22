# Phase 0 Playbook — OpenWA, Webhooks, Tines Echo

> **Prerequisite:** WhatsApp paired in OpenWA (personal number is fine for POC).  
> **Goal:** Send/receive test messages, verify HMAC webhooks, Tines echo Story, API inventory for bot.

---

## Variables to set (your machine)

```bash
export OPENWA_BASE="http://localhost:2785"    # or your OpenWA host:port
export OPENWA_API_KEY="your-key-from-.api-key" # docker exec openwa-api cat /app/data/.api-key
export SESSION_ID="default"                    # list sessions — see step 1
export WEBHOOK_SECRET="paysasuchan-openwa-poc-secret-change-me"
```

---

## 1. Send / receive a test message

### 1.1 Find your session ID

```bash
curl -s "$OPENWA_BASE/api/sessions" \
  -H "X-API-Key: $OPENWA_API_KEY" | jq .
```

Use the `id` or `name` of your paired session (often `default` or the name you chose at pairing). Set:

```bash
export SESSION_ID="<your-session-id>"
```

### 1.2 Check session is connected

```bash
curl -s "$OPENWA_BASE/api/sessions/$SESSION_ID" \
  -H "X-API-Key: $OPENWA_API_KEY" | jq .
```

Status should show connected / ready (exact field names vary by OpenWA version).

### 1.3 Send a test message **to yourself** (or another number)

WhatsApp chat IDs use format: `{countrycode}{number}@c.us` (no `+`).

Example — message your own phone `919876543210`:

```bash
curl -X POST "$OPENWA_BASE/api/sessions/$SESSION_ID/messages/send-text" \
  -H "X-API-Key: $OPENWA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "919876543210@c.us",
    "text": "Hello from PaySaSuchan OpenWA POC"
  }'
```

You should see the message in WhatsApp on that chat.

### 1.4 Receive a test message

1. From another phone (or WhatsApp Web), send a message **to your paired WhatsApp number**
2. In OpenWA dashboard → session → messages, **or** wait for webhook (step 2)

Optional — list recent messages via API (if your OpenWA version exposes it):

```bash
curl -s "$OPENWA_BASE/api/sessions/$SESSION_ID/messages?limit=5" \
  -H "X-API-Key: $OPENWA_API_KEY" | jq .
```

**Phase 0 pass:** Outbound send works + inbound message visible in OpenWA UI or webhook logs.

---

## 2. Verify webhook + HMAC signature

OpenWA must POST to a **public HTTPS URL**. For local dev use **ngrok** (or Cloudflare Tunnel).

### 2.1 Nexpo webhook endpoint (already in repo)

| Item | Value |
|------|-------|
| Route | `POST /api/webhooks/openwa` |
| Env | `OPENWA_WEBHOOK_SECRET` (must match secret you set in OpenWA webhook) |
| Code | `app/api/webhooks/openwa/route.ts`, `lib/openwa/verifyWebhookSignature.ts` |

Add to `.env.local`:

```env
OPENWA_WEBHOOK_SECRET=paysasuchan-openwa-poc-secret-change-me
```

Start Nexpo:

```bash
npm run dev
```

### 2.2 Expose localhost with ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL, e.g. `https://abc123.ngrok-free.app`

Webhook URL for OpenWA:

```text
https://abc123.ngrok-free.app/api/webhooks/openwa
```

### 2.3 Register webhook in OpenWA

```bash
curl -X POST "$OPENWA_BASE/api/sessions/$SESSION_ID/webhooks" \
  -H "X-API-Key: $OPENWA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"https://abc123.ngrok-free.app/api/webhooks/openwa\",
    \"events\": [\"message.received\", \"session.status\"],
    \"secret\": \"$WEBHOOK_SECRET\",
    \"retryCount\": 3
  }"
```

`secret` must equal `OPENWA_WEBHOOK_SECRET` in Nexpo.

### 2.4 Test inbound message → webhook

1. Send a WhatsApp message to your paired number
2. Watch Nexpo terminal — in dev you should see `[openwa webhook]` log
3. Or check ngrok inspector at `http://127.0.0.1:4040`

**Expected success response from Nexpo:**

```json
{
  "ok": true,
  "event": "message.received",
  "idempotencyKey": "...",
  "receivedAt": "..."
}
```

### 2.5 Test invalid signature (should fail)

```bash
curl -X POST "http://localhost:3000/api/webhooks/openwa" \
  -H "Content-Type: application/json" \
  -H "X-OpenWA-Signature: sha256=deadbeef" \
  -d '{"test":true}'
```

Expected: **401** `{ "error": "Invalid signature" }`

### 2.6 Local HMAC test script (no WhatsApp)

```bash
node scripts/openwa-verify-hmac-sample.mjs
```

**Phase 0 pass:** Valid signature → 200; invalid → 401; real WhatsApp message triggers webhook.

### OpenWA signature format

| Header | Purpose |
|--------|---------|
| `X-OpenWA-Signature` | `sha256=` + HMAC-SHA256 of **raw body** |
| `X-OpenWA-Event` | e.g. `message.received` |
| `X-OpenWA-Idempotency-Key` | Dedupe key for bot layer |

---

## 3. Create Tines tenant + echo webhook Story

Tines is **external** — create at [tines.com](https://www.tines.com).

### 3.1 Create tenant

1. Sign up / log in to Tines
2. Create a tenant (e.g. `paysasuchan-dev`)
3. Note region URL: `https://<tenant>.tines.com`

### 3.2 Echo Story (minimal POC)

**Story name:** `openwa-echo-poc`

**Action 1 — Webhook (trigger)**

- Type: **Webhook**
- Method: POST
- Authentication: Shared secret (optional for POC) or “None” for first test
- Copy the **Webhook URL** Tines gives you

**Action 2 — Event Transform (optional)**

- Parse `{{ webhook.body }}` for debugging

**Action 3 — HTTP Request (echo)**

- Method: POST
- URL: your choice for POC — or use **Send to Story** to log only
- For true echo: if OpenWA supports reply via separate API, Tines would call OpenWA later; for POC just **Email yourself** or **Slack** the payload

**Simpler POC:** Webhook action only → view **Runs** tab when payload arrives.

### 3.3 Point OpenWA at Tines (alternative to Nexpo)

For pure Tines POC, register Tines webhook URL in OpenWA (same curl as §2.3 but Tines URL).

**Recommended architecture (later):**

```text
OpenWA → Tines (STORY-01) → Nexpo Command API
Nexpo events → Tines (STORY-03)
```

For Phase 0, either:

- **A)** OpenWA → Nexpo `/api/webhooks/openwa` (HMAC POC) ✅ in repo  
- **B)** OpenWA → Tines echo Story  
- **C)** Both (different events) — not needed yet

### 3.4 Tines credentials to store (for Phase 3+)

| Secret in Tines vault | Value |
|-----------------------|-------|
| `OPENWA_API_KEY` | From OpenWA `.api-key` |
| `OPENWA_BASE_URL` | OpenWA API base |
| `BOT_COMMAND_SECRET` | Future Nexpo internal API |
| `OPENWA_WEBHOOK_SECRET` | Same as Nexpo env |

See `release6.0/tines-stories.md` for full Story map.

**Phase 0 pass:** Send test JSON to Tines webhook URL → run appears in Tines UI.

---

## 4. Nexpo APIs the bot will use

Full reference: **`release6.0/bot-api-inventory.md`**

**Summary for bot MVP:**

| Bot need | Today (user JWT API) | Future (bot Command API) |
|----------|----------------------|---------------------------|
| Add expense | `POST /api/user/transaction` | `CREATE_EXPENSE` → `TransactionService` |
| Add income | Same, `type: CREDIT` | `CREATE_INCOME` |
| List / edit / delete | `/api/user/transaction(s)` | `GET_TRANSACTIONS`, etc. |
| Reports | `GET /api/user/reports` | `GET_MONTHLY_SUMMARY`, etc. |
| Plan gates | `PlanService` on every write | Same via Command API |
| Link WhatsApp user | Not built yet | `ChannelAccount` + web link flow |

**Important:** Bot must **not** call user JWT routes with stolen tokens. Phase 1 adds `POST /api/internal/bot/command` with service auth.

---

## Phase 0 checklist

| # | Task | Pass? |
|---|------|-------|
| 1 | Send text via OpenWA API | ☐ |
| 2 | Receive message on paired WhatsApp | ☐ |
| 3 | Webhook registered with `secret` | ☐ |
| 4 | Nexpo returns 200 on real `message.received` | ☐ |
| 5 | Nexpo returns 401 on bad signature | ☐ |
| 6 | Tines echo Story receives test POST | ☐ |
| 7 | Read `bot-api-inventory.md` | ☐ |

---

## Security reminders (personal WhatsApp POC)

- Use a **dedicated test number** before production — personal number risks ban/limit from automation
- Never commit API keys or webhook secrets
- Rotate `OPENWA_API_KEY` before production; use scoped operator key
- OpenWA session files on disk are sensitive — protect Docker volume

---

## Connect OpenWA + Tines + Nexpo together

See **`release6.0/integration-wiring-guide.md`** for full direction-of-data, ngrok, Tines Story actions, and the `/api/webhooks/tines-bridge` endpoint.

## Next step after Phase 0

**Phase 1:** Implement `lib/bot/core/` + `POST /api/internal/bot/command` — see `release6.0/plan.md` and `release6.0/wbs.md` (P1.x tasks).
