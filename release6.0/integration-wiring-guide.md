# Integration Wiring Guide — OpenWA + Tines + Nexpo

> **You have:** OpenWA paired · Tines webhook Story · Nexpo on `localhost:3000`  
> **This doc:** Exactly what connects to what, in which direction, with which URLs and secrets.

---

## 1. The big picture (direction of data)

```text
                         INBOUND (user sends WhatsApp message)
                         =====================================

   [User WhatsApp]  -->  [OpenWA]  -->  [Tines Story]  -->  [Nexpo]
                              ^              |
                              |              v
                              +--------  [OpenWA send-text]  (reply back to user)


                         OUTBOUND (later — after transaction saved)
                         =============================================

   [Nexpo DB]  -->  [event outbox]  -->  [Tines]  -->  alerts / summaries / WhatsApp
```

### Who talks to whom?

| From | To | Why | Protocol |
|------|-----|-----|----------|
| **OpenWA** | **Tines** | New WhatsApp message arrived | HTTPS POST webhook |
| **Tines** | **Nexpo** | Record intent / run command (POC: log only) | HTTPS POST + Bearer token |
| **Tines** | **OpenWA** | Reply to user on WhatsApp | HTTPS POST + `X-API-Key` |
| **Nexpo** | **Tines** | `expense.created` etc. (Phase 2+) | HTTPS POST webhook |

**Nexpo does NOT talk to OpenWA directly** in the target architecture — Tines sits in the middle for messages.

---

## 2. Why ngrok is required (local Nexpo)

| Component | Where it runs | Can reach localhost? |
|-----------|---------------|----------------------|
| OpenWA | Docker on your Mac | **No** — needs public URL for webhooks |
| Tines | Cloud (tines.com) | **No** — cannot call `http://localhost:3000` |
| Nexpo | `localhost:3000` | — |

**Solution:** Expose Nexpo through **ngrok** (or Cloudflare Tunnel):

```bash
ngrok http 3000
```

You get something like: `https://a1b2c3.ngrok-free.app`

Use that as the **public base URL** for Nexpo in all Tines HTTP actions.

---

## 3. Environment variables (three places)

### 3.1 Nexpo (`.env.local`)

```env
# OpenWA → Nexpo DIRECT path only (optional; skip if using Tines-only chain)
OPENWA_WEBHOOK_SECRET=your-openwa-webhook-secret

# Tines → Nexpo (required for OpenWA → Tines → Nexpo chain)
TINES_BRIDGE_SECRET=choose-a-long-random-string-here
```

Restart `npm run dev` after changes.

### 3.2 OpenWA (docker-compose `.env` or dashboard)

You already have:

- `OPENWA_API_KEY` — from `docker exec openwa-api cat /app/data/.api-key`

For **webhook registration** you only set URL + secret in the webhook API call (not always a global env).

### 3.3 Tines (Story credentials / vault)

Store these in Tines **Credentials** (recommended) or Story options:

| Credential name | Value | Used for |
|-----------------|-------|----------|
| `openwa_api_key` | Your OpenWA admin/operator key | Send WhatsApp replies |
| `openwa_base_url` | `http://host.docker.internal:2785` or public OpenWA URL | OpenWA REST calls from Tines |
| `tines_bridge_secret` | Same as `TINES_BRIDGE_SECRET` in Nexpo | Call Nexpo bridge |
| `nexpo_public_url` | `https://YOUR-NGROK.ngrok-free.app` | Nexpo HTTP actions |

> **Note:** If Tines runs in the cloud, it **cannot** call `http://localhost:2785` for OpenWA unless OpenWA is also on a public URL. For replies from Tines → OpenWA you may need **ngrok for OpenWA too** (`ngrok http 2785`) or deploy OpenWA on a VPS.

---

## 4. Wiring step-by-step (do in this order)

### Step A — Expose Nexpo

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
```

Copy HTTPS URL → `NEXPO_PUBLIC=https://a1b2c3.ngrok-free.app`

Test:

```bash
curl -s "$NEXPO_PUBLIC/api/health"
```

---

### Step B — Point OpenWA webhook at **Tines** (inbound messages)

Get your **Tines Webhook URL** from the Story (Webhook action). It looks like:

```text
https://YOUR-TENANT.tines.com/webhook/xxxxxxxx
```

Register in OpenWA:

```bash
export OPENWA_BASE="http://localhost:2785"
export OPENWA_API_KEY="your-key"
export SESSION_ID="default"
export TINES_WEBHOOK_URL="https://YOUR-TENANT.tines.com/webhook/xxxxxxxx"
export WEBHOOK_SECRET="openwa-to-tines-secret"

curl -X POST "$OPENWA_BASE/api/sessions/$SESSION_ID/webhooks" \
  -H "X-API-Key: $OPENWA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$TINES_WEBHOOK_URL\",
    \"events\": [\"message.received\"],
    \"secret\": \"$WEBHOOK_SECRET\",
    \"retryCount\": 3
  }"
```

**Direction:** `OpenWA ──POST──> Tines`

**Test:** Send a WhatsApp message to your paired number → Tines Story should show a new **Run**.

---

### Step C — Configure Tines Story (middle layer)

Create or extend Story: **`whatsapp-inbound-poc`**

```mermaid
flowchart LR
    W[Webhook trigger<br/>from OpenWA] --> T[Event Transform<br/>extract fields]
    T --> N[HTTP Request<br/>to Nexpo bridge]
    N --> R[HTTP Request<br/>OpenWA send-text reply]
```

#### Action 1 — Webhook (already done)

- Receives POST from OpenWA
- Headers include: `X-OpenWA-Event`, `X-OpenWA-Signature`, `X-OpenWA-Idempotency-Key`
- Body = JSON event payload

#### Action 2 — Event Transform (optional but helpful)

Extract for later steps:

| Tines variable | Source (typical) |
|----------------|------------------|
| `event_name` | `{{ webhook.headers["X-OpenWA-Event"] }}` |
| `idempotency_key` | `{{ webhook.headers["X-OpenWA-Idempotency-Key"] }}` |
| `message_text` | `{{ webhook.body.message.body }}` or explore `webhook.body` in a test run |
| `chat_id` | `{{ webhook.body.message.from }}` or `chatId` field — **check your actual payload in Tines Run** |

> OpenWA payload shape varies by version — always inspect the first successful Tines Run and adjust paths.

#### Action 3 — HTTP Request → Nexpo

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{ credential.nexpo_public_url }}/api/webhooks/tines-bridge` |
| Header | `Authorization: Bearer {{ credential.tines_bridge_secret }}` |
| Header | `Content-Type: application/json` |
| Body | See JSON below |

```json
{
  "channel": "whatsapp",
  "event": "<<EVENT_TRANSFORM.event_name>>",
  "idempotency_key": "<<EVENT_TRANSFORM.idempotency_key>>",
  "payload": <<WEBHOOK.body>>
}
```

(In Tines, use liquid `{{ }}` syntax for your tenant — replace `<< >>` with actual Tines interpolation.)

**Direction:** `Tines ──POST──> Nexpo`

**Test:** After WhatsApp message, Nexpo terminal should log:

```text
[tines-bridge] { channel: 'whatsapp', event: 'message.received', ... }
```

#### Action 4 — HTTP Request → OpenWA (reply)

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `{{ credential.openwa_base_url }}/api/sessions/default/messages/send-text` |
| Header | `X-API-Key: {{ credential.openwa_api_key }}` |
| Header | `Content-Type: application/json` |
| Body | |

```json
{
  "chatId": "<<chat_id from transform>>",
  "text": "PaySaSuchan received: <<message_text>>"
}
```

**Direction:** `Tines ──POST──> OpenWA ──> WhatsApp user`

**Caveat:** Tines cloud → your local OpenWA only works if OpenWA has a **public URL** (second ngrok: `ngrok http 2785`) or OpenWA is on a server. If this step fails, fix `openwa_base_url` first.

---

### Step D — End-to-end test

1. Send WhatsApp: `Spent 500 on lunch`
2. **OpenWA** fires webhook → **Tines** Run succeeds (Action 1)
3. **Tines** calls Nexpo → `[tines-bridge]` in Nexpo logs (Action 3)
4. **Tines** calls OpenWA send-text → you get reply on WhatsApp (Action 4)

**Phase 0 pass:** Full loop without Nexpo changing any financial data yet.

---

## 5. Two valid wiring patterns (don't mix them up)

### Pattern A — Production target (use this)

```text
WhatsApp → OpenWA → Tines → Nexpo (tines-bridge → future Command API)
                ↑
                └── Tines → OpenWA (replies)
```

- OpenWA webhook URL = **Tines only**
- Nexpo endpoint = `/api/webhooks/tines-bridge` + `TINES_BRIDGE_SECRET`

### Pattern B — HMAC test only (optional, bypasses Tines)

```text
WhatsApp → OpenWA → ngrok → Nexpo /api/webhooks/openwa
```

- OpenWA webhook URL = `https://ngrok.../api/webhooks/openwa`
- Uses `OPENWA_WEBHOOK_SECRET` + HMAC verification in Nexpo
- Use this to **verify signatures**, not for production orchestration

**Do not register both URLs on the same OpenWA session for the same event** unless you intend duplicate processing.

---

## 6. Future wiring (after Phase 1 Command API)

Replace Action 3 body with a call to:

```text
POST {{nexpo_public_url}}/api/internal/bot/command
Authorization: Bearer {{bot_command_secret}}
```

```json
{
  "command": "CREATE_EXPENSE",
  "user_id": "...",
  "idempotency_key": "...",
  "source_channel": "whatsapp",
  "payload": { "amount": 500, "description": "lunch" }
}
```

Nexpo will then emit `expense.created` → Tines (Phase 2) for alerts.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Tines never runs | OpenWA webhook URL wrong / session disconnected | Re-check webhook list; QR re-pair |
| Tines runs, Nexpo silent | Wrong ngrok URL or `TINES_BRIDGE_SECRET` mismatch | Curl Nexpo bridge manually (below) |
| Nexpo 401 | Bearer token wrong | Match `TINES_BRIDGE_SECRET` exactly |
| Nexpo 503 | Env not set | Add `TINES_BRIDGE_SECRET`, restart dev server |
| No WhatsApp reply | Tines can't reach local OpenWA | ngrok OpenWA port 2785 or deploy OpenWA |
| Duplicate messages | Two webhooks registered | Delete extra webhook in OpenWA |
| Empty `message_text` in Tines | Wrong JSON path in transform | Inspect webhook.body in Tines Run |

### Manual test — Nexpo bridge (no WhatsApp)

```bash
curl -X POST "https://YOUR-NGROK.ngrok-free.app/api/webhooks/tines-bridge" \
  -H "Authorization: Bearer YOUR_TINES_BRIDGE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "whatsapp",
    "event": "message.received",
    "idempotency_key": "test-1",
    "payload": { "message": { "body": "hello" } }
  }'
```

Expected: `200` + `{ "ok": true, ... }`

---

## 8. Checklist — all three connected

| # | Connection | Direction | Done? |
|---|------------|-----------|-------|
| 1 | OpenWA → Tines webhook | Outbound from OpenWA | ☐ |
| 2 | Tines → Nexpo `/api/webhooks/tines-bridge` | Outbound from Tines | ☐ |
| 3 | Tines → OpenWA `send-text` | Outbound from Tines | ☐ |
| 4 | ngrok exposing Nexpo :3000 | — | ☐ |
| 5 | (If needed) ngrok exposing OpenWA :2785 | — | ☐ |
| 6 | WhatsApp round-trip echo works | — | ☐ |

---

## 9. Quick reference diagram

```mermaid
sequenceDiagram
    participant U as User WhatsApp
    participant O as OpenWA
    participant T as Tines
    participant N as Nexpo local via ngrok

    U->>O: Sends message
    O->>T: POST webhook (HMAC signed)
    T->>N: POST /api/webhooks/tines-bridge (Bearer)
    N-->>T: 200 OK
    T->>O: POST send-text (API key)
    O->>U: Reply on WhatsApp
```

---

## Related files

| File | Purpose |
|------|---------|
| `app/api/webhooks/tines-bridge/route.ts` | Nexpo ingress from Tines |
| `app/api/webhooks/openwa/route.ts` | Direct OpenWA HMAC (optional) |
| `release6.0/phase0-openwa-playbook.md` | OpenWA setup |
| `release6.0/bot-api-inventory.md` | APIs for Phase 1 |
| `release6.0/tines-stories.md` | Full Story map |
