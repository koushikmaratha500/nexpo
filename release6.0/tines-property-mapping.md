# Tines Property Mapping — Your OpenWA Story

> Based on your live event JSON (`ps_wa_webhook` → `ai_parsing_agent`).

## Why AI returned UNKNOWN

Your AI Agent prompt had **empty fields**:

```text
message_text:

```

The model correctly said: *"Please provide a message to parse."*

**Fix:** Map `message_text` from `ps_wa_webhook.body.data.body`.

---

## OpenWA payload paths (your webhook)

| Field you need | Tines path (pill / formula) |
|----------------|----------------------------|
| Message text | `ps_wa_webhook.body.data.body` |
| Chat ID (for reply) | `ps_wa_webhook.body.data.chatId` |
| Sender | `ps_wa_webhook.body.data.from` |
| Session ID | `ps_wa_webhook.body.sessionId` |
| Idempotency key | `ps_wa_webhook.body.idempotencyKey` |
| Event name | `ps_wa_webhook.body.event` |
| Sender name | `ps_wa_webhook.body.data.contact.pushName` |
| Signature header | `ps_wa_webhook.headers.x_openwa_signature` |

**Your test message:**

```text
Hi, I went to Chandra mandalam restaurant today for breakfast and had Idly, Dosa and the bill is 750
```

**Expected AI output after fix:**

```json
{
  "intent": "CREATE_EXPENSE",
  "confidence": 0.88,
  "type": "DEBIT",
  "amount": 750,
  "currency": "INR",
  "merchant": "Chandra mandalam restaurant",
  "category": "Food",
  "description": "Breakfast - Idly, Dosa",
  "transaction_date": "2026-09-18",
  "clarification_question": null
}
```

---

## Step 1 — PS-WA-Webhook

No mapping needed. Receives OpenWA POST.

---

## Step 2 — AI-PARSING-AGENT

### Instructions field

Paste from `release6.0/tines-ai-instructions.md` (already done in your run).

### Prompt field — copy this and insert Tines pills

In Tines, click **Insert** → pick from `PS-WA-Webhook` event for each line, OR type formulas below.

```text
Parse the following WhatsApp message for PaySaSuchan and return ONE JSON object only.

=== INPUT ===
reference_date: <<FORMULA: see below>>
reference_timezone: Asia/Kolkata
channel: whatsapp
external_user_id: << ps_wa_webhook.body.data.chatId >>
user_linked: true
user_id: dev-test-user
idempotency_key: << ps_wa_webhook.body.idempotencyKey >>

message_text:
<< ps_wa_webhook.body.data.body >>

=== OUTPUT SCHEMA ===
(same schema as tines-ai-prompt.md — keep your existing block)

Now parse the message above and output JSON only.
```

### reference_date formula (Tines)

Use one of:

- **Formula action pill:** `=DATE_FORMAT(NOW(), "%Y-%m-%d", "Asia/Kolkata")`
- **Or hardcode for testing:** `2026-09-18`

### Tines pill syntax (how to insert)

1. Open **AI-PARSING-AGENT** → **Prompt**
2. Place cursor after `message_text:`
3. Press **/** or **Insert** → **Event output** → **PS-WA-Webhook** → navigate to:
   - `body` → `data` → `body`
4. Repeat for `chatId`, `idempotencyKey`, `sessionId`

**Do NOT** leave blank lines after colons.

### Property mapping table (AI Agent Prompt)

| Prompt line | Map to (event: PS-WA-Webhook) |
|-------------|-------------------------------|
| `reference_date` | Formula `DATE_FORMAT(NOW(),"%Y-%m-%d","Asia/Kolkata")` or static date |
| `reference_timezone` | Literal: `Asia/Kolkata` |
| `channel` | Literal: `whatsapp` |
| `external_user_id` | `body.data.chatId` → `201137630216422@lid` |
| `user_linked` | `true` (until Nexpo resolve-user exists) |
| `user_id` | Your test Nexpo user UUID (dev only) |
| `idempotency_key` | `body.idempotencyKey` |
| `message_text` | **`body.data.body`** ← REQUIRED |

---

## Step 3 — SEND-HTTP (Nexpo tines-bridge) — saves to DB

Connect: **AI-PARSING-AGENT** → **SEND-HTTP** (Nexpo).

### Purpose

Send AI parse result to Nexpo. Nexpo resolves user, saves transaction, returns `reply_text`.

### HTTP settings

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://YOUR-NGROK.ngrok-free.app/api/webhooks/tines-bridge` |

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer YOUR_TINES_BRIDGE_SECRET` |
| `Content-Type` | `application/json` |

### Body (JSON)

```json
{
  "channel": "whatsapp",
  "event": "<< ps_wa_webhook.body.event >>",
  "idempotency_key": "<< ps_wa_webhook.body.idempotencyKey >>",
  "session_id": "<< ps_wa_webhook.body.sessionId >>",
  "external_user_id": "<< ps_wa_webhook.body.data.chatId >>",
  "message_text": "<< ps_wa_webhook.body.data.body >>",
  "ai_parse": "<< ai_parsing_agent.output >>"
}
```

### Nexpo response (use in Step 4)

```json
{
  "ok": true,
  "success": true,
  "reply_text": "✅ Expense saved\n\n₹750 · Food\n...",
  "transaction_id": "uuid",
  "intent": "CREATE_EXPENSE"
}
```

---

## Step 4 — RECV-HTTP (OpenWA reply)

Connect: **SEND-HTTP** (Nexpo) → **RECV-HTTP** (OpenWA send-text).

### Purpose

Send WhatsApp reply via OpenWA `send-text` using Nexpo `reply_text`.

### HTTP settings

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `http://YOUR-OPENWA-HOST:2785/api/sessions/<<sessionId>>/messages/send-text` |
| URL sessionId | `<< ps_wa_webhook.body.sessionId >>` → `2ac70cbe-b80f-4551-af51-2f89eb280ae1` |

Example full URL:

```text
http://localhost:2785/api/sessions/2ac70cbe-b80f-4551-af51-2f89eb280ae1/messages/send-text
```

If Tines is cloud, OpenWA must be on **public URL** (ngrok on 2785).

### Headers

| Header | Value |
|--------|-------|
| `X-API-Key` | Your OpenWA API key (credential) |
| `Content-Type` | `application/json` |

### Body (JSON)

```json
{
  "chatId": "<< ps_wa_webhook.body.data.chatId >>",
  "text": "<< send_http_to_nexpo.body.reply_text >>"
}
```

Nexpo builds the full reply text — no need to branch on intent in Tines.

### SEND-HTTP property mapping table

| JSON field | Source |
|------------|--------|
| `chatId` | `ps_wa_webhook.body.data.chatId` |
| `text` | Build from `ai_parsing_agent.output.*` (see templates above) |

**Important:** Use `@lid` chatId exactly as received — your sender uses `isLidSender: true`.

---

## Correct story wiring

```text
PS-WA-Webhook
    └──> AI-PARSING-AGENT ──> SEND-HTTP (Nexpo tines-bridge) ──> RECV-HTTP (OpenWA send-text)
```

**Your screenshot issue:** AI-PARSING-AGENT is NOT connected to SEND-HTTP. Draw a link from AI → SEND-HTTP.

**SEND-HTTP red error:** Usually wrong URL, missing API key, or OpenWA not reachable from Tines cloud.

---

## Quick fix checklist

| # | Action |
|---|--------|
| 1 | Map `message_text` → `ps_wa_webhook.body.data.body` |
| 2 | Map `idempotency_key` → `ps_wa_webhook.body.idempotencyKey` |
| 3 | Map `external_user_id` → `ps_wa_webhook.body.data.chatId` |
| 4 | Set `reference_date` (formula or today) |
| 5 | Connect AI-PARSING-AGENT → SEND-HTTP |
| 6 | SEND-HTTP body: `chatId` + `text` from AI output |
| 7 | SEND-HTTP URL: include `ps_wa_webhook.body.sessionId` |
| 8 | Link WhatsApp user in Nexpo (see below) |
| 9 | Re-run story with same WhatsApp message |

---

## Link your WhatsApp to a Nexpo user (required)

Nexpo must know which user owns this WhatsApp chat.

**Option A — dev script (recommended for testing):**

```bash
npx tsx scripts/link-whatsapp-user.ts YOUR_USER_UUID "201137630216422@lid"
```

**Option B — dev env auto-link (any WhatsApp → one user):**

```env
BOT_DEV_USER_ID=your-nexpo-user-uuid
```

**Option C — inline user_id in Tines body (dev only):**

```env
BOT_ALLOW_INLINE_USER_ID=true
```

Then add `"user_id": "your-uuid"` to the tines-bridge JSON body.

---

## Nexpo env vars

```env
TINES_BRIDGE_SECRET=your-shared-secret
BOT_COMMAND_SECRET=your-bot-secret        # for /api/internal/bot/*
BOT_DEV_USER_ID=                          # optional dev auto-link
BOT_ALLOW_INLINE_USER_ID=false            # optional dev inline user_id
```

Run once after pulling:

```bash
npm run db:push
```

---

## Test again

Send the same message:

> Hi, I went to Chandra mandalam restaurant today for breakfast and had Idly, Dosa and the bill is 750

AI output should show `CREATE_EXPENSE`, `amount: 750`, not UNKNOWN.

