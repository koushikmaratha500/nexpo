# Release 6.0 — WhatsApp + Telegram Conversational Interface

> **Purpose:** Add PaySaSuchan as a conversational financial assistant on **WhatsApp (OpenWA)** and **Telegram (grammY)**, with a channel-independent bot/command engine. PaySaSuchan remains the system of record.
>
> **Builds on:** Release 5.0 billing/entitlements, Release 4.x transactions/reports/AI, layered API (`AGENTS.md`).
>
> **Ground-zero assumption:** OpenWA and grammY are **not** existing infrastructure — deploy, configure, harden, pair, and integrate from scratch.

---

## How to use this document

1. Work **phase by phase** — each phase has acceptance criteria and dependencies.
2. Mark tasks: `[ ]` todo · `[~]` in progress · `[x]` done · `[—]` deferred.
3. Schema changes: `prisma migrate` + update `release6.0/schema-draft.prisma` when created.
4. Run `npm run test:all` before release tag.
5. **Do not start bot channels until Phase 1 (command engine) passes without WhatsApp/Telegram.**

**Related docs**

| Doc | Role |
|-----|------|
| `AGENTS.md` | Layered architecture — bot engine calls **services**, not Prisma from adapters |
| `release5.0/billing-go-live-checklist.md` | Plan gating for bot writes (402 / trial expiry) |
| `lib/ai/tools/finance.tools.ts` | Reusable read/summary patterns for bot + AI layer |
| `release6.0/schema-draft.prisma` | Proposed bot tables (create in Phase 1) |

---

## Executive summary

| Item | Decision |
|------|----------|
| WhatsApp gateway | **OpenWA** (self-hosted, REST + webhooks + HMAC) |
| Telegram gateway | **grammY** (BotFather bot + webhook/polling) |
| Financial backend | Existing **nexpo** services (`TransactionService`, `ReportService`, `PlanService`, etc.) |
| Database | **Prisma + Postgres** (not Supabase ORM/RLS — Supabase is OAuth + file storage only) |
| Income model | `Transaction` with `type: CREDIT` (no separate income table) |
| Bank accounts | **Not in schema** — `PaymentType` lookup only; bot “balance” = report aggregates |
| Budgets | **Deferred** post-MVP |
| Architecture rule | OpenWA/grammY are **transport adapters** — replaceable without rewriting financial logic |

**Timeline:** 8–10 weeks MVP (1 FTE + part-time QA/DevOps). Production-grade with voice/rich AI: 12–16 weeks.

---

## Architecture

```text
                         PAY SASUCHAN (nexpo)
                    Web · Mobile · Admin · API
                              │
              ┌───────────────┴────────────────┐
              │      Bot Command Engine        │
              │  (channel-independent core)    │
              └───────────────┬────────────────┘
                              │
              ┌───────────────┴────────────────┐
              │     Channel Adapter Layer      │
              └───────────────┬────────────────┘
                    ┌─────────┴─────────┐
                    │                   │
              WhatsApp Adapter    Telegram Adapter
                    │                   │
                 OpenWA               grammY
                    │                   │
                 WhatsApp           Telegram
```

**Data flow (mutations):**

```text
Channel message → Normalize → Resolve linked userId → Intent/Command
  → Validate → PlanService (entitlements) → Service layer → Prisma
  → Audit + idempotency → Format response → Channel adapter → User
```

**AI boundary (Phase 8+):** AI may parse/classify/suggest — it must **not** write to DB directly. All mutations go through the command engine with confirmation.

---

## Corrections from generic draft → nexpo reality

| Draft assumption | Actual in nexpo |
|------------------|-----------------|
| Supabase as primary DB + RLS | Prisma/Postgres; auth via custom JWT + `Session` |
| `POST /api/v1/transactions` greenfield | Reuse `/api/user/transaction(s)` **or** call services directly from bot engine |
| Separate income API | `TransactionService.create` with `type: CREDIT` |
| `GET /api/v1/accounts` | No account balances — use `ReportService` + payment type metadata |
| `GET /api/v1/reports/*` | `ReportService.getCustomerReport` + transaction list APIs |
| OpenQA | **OpenWA** |
| Edge Functions | Next.js API routes + Trigger.dev for async jobs |

---

## Phase 0 — Ground Zero (Week 1)

**Milestone M0:** Existing system documented; OpenWA + grammY smoke-tested locally.

### Module 0.1 — Application discovery

| Area | Finding |
|------|---------|
| Frontend | Next.js 16 App Router (`app/customer`, `app/admin`) |
| Mobile | Expo (`mobile/`) |
| API | Layered: controllers → services → repositories |
| Auth | Email/password + Google OAuth; JWT sessions |
| Transactions | Unified `Transaction` model; personal = `groupId IS NULL` |
| Categories | `Category` + user defaults via meta resolution |
| Reports | `GET /api/user/reports` |
| AI | `lib/ai/` — chat tools, OCR, insights; plan-gated |
| Billing | Release 5.0 — Freemium trial, Starter/Pro, 402 on writes |

**Tasks**

- [ ] Document transaction create/update/delete flows (`TransactionService`)
- [ ] Document report shapes (`ReportService`, `lib/ai/aggregates.ts`)
- [ ] Document plan write locks (`PlanService.assertCanWrite`)
- [ ] Document category/payment-type resolution (`MetaResolutionService` or equivalent)
- [ ] List env secrets needed for bot platform (OpenWA API key, Telegram token, webhook secrets)

### Module 0.2 — Feature capability matrix

| PaySaSuchan feature | Existing API / service? | Bot MVP? | Required work |
|---------------------|-------------------------|----------|---------------|
| Add expense (DEBIT) | Yes — `TransactionService` | Yes | Bot command + formatter |
| Add income (CREDIT) | Yes — same service | Yes | Bot command |
| Edit transaction | Yes | Yes | Command + “last transaction” context |
| Delete transaction | Yes | Yes | Confirmation flow |
| List transactions | Yes — repository + API | Yes | Query commands |
| Categories | Yes | Yes | Fuzzy match + picker in conversation |
| Payment types | Yes (not bank accounts) | Partial | Map “cash/UPI/card” to lookup |
| Daily/weekly/monthly summary | Yes — reports + AI aggregates | Yes | Report commands |
| Category breakdown | Yes | Yes | Report commands |
| Budget status | No entity | Later | — |
| Recurring | Limited / reminders | Later | — |
| Export CSV | Yes (web) | Later | — |
| Receipt OCR | Yes — AI OCR route | Later | Media pipeline (Phase 9) |
| Group expenses | Yes | Later | Out of MVP scope |
| Account linking (bot) | **No** | Yes | Phase 4 schema + flows |

### Module 0.3 — Security assessment

- [ ] Review JWT/session model — bot engine needs **service identity** per linked user, not channel trust
- [ ] Review rate limiting (Redis) — extend for webhook endpoints
- [ ] Review audit patterns (`UserRepository.createAudit`, transaction audits)
- [ ] Identify PII in bot logs (phone numbers, Telegram IDs) — masking policy
- [ ] Confirm billing 402 behavior applies to bot-initiated writes

### Module 0.4 — Channel feasibility (local only)

- [ ] Deploy OpenWA locally (Docker): API, Postgres, Redis, session volume
- [ ] Pair test WhatsApp session (QR); send/receive message
- [ ] Verify webhook + HMAC signature validation against test endpoint
- [ ] Create Telegram bot via BotFather; grammY hello-world with long polling
- [ ] **No production credentials in Phase 0**

### M0 acceptance criteria

```text
✓ Architecture + API inventory documented in release6.0/
✓ Feature matrix signed off
✓ OpenWA local: message in/out + HMAC verified
✓ grammY local: /start receives reply
✓ MVP scope agreed (no voice/budget/groups in v1)
```

---

## Phase 1 — Bot Command Foundation (Week 2)

**Milestone M1:** Channel-independent financial command engine — provable without WhatsApp/Telegram.

### Module 1.1 — Service integration (not greenfield /api/v1)

**Decision:** Bot engine imports **services** directly (same process or internal module). Optional thin `POST /api/internal/bot/execute` for OpenWA sidecar later — still calls services.

| Command | Service / repository |
|---------|----------------------|
| `CREATE_EXPENSE` | `TransactionService.create` (`type: DEBIT`) |
| `CREATE_INCOME` | `TransactionService.create` (`type: CREDIT`) |
| `UPDATE_TRANSACTION` | `TransactionService.update` |
| `DELETE_TRANSACTION` | `TransactionService.delete` |
| `GET_TRANSACTIONS` | `TransactionRepository.findAll` |
| `GET_DAILY_SUMMARY` | `ReportService` / `getMonthSummary` patterns |
| `GET_MONTHLY_SUMMARY` | Same |
| `GET_CATEGORY_SUMMARY` | Report + filter |

**Tasks**

- [ ] Create `lib/bot/` (or `bot-platform/core/`) package structure
- [ ] Define `BotCommand` enum + Zod input schemas (`lib/bot/commands/`)
- [ ] Implement `BotCommandEngine.execute(command, ctx)` — validate → authorize → execute → audit
- [ ] Wire `PlanService.assertCanWrite` before mutations
- [ ] Unit tests: command → DB row without any channel mock

### Module 1.2 — Response formatter

- [ ] `BotResponse` channel-neutral JSON (`success`, `type`, `payload`, `errors`)
- [ ] `formatForTelegram(response)` / `formatForWhatsApp(response)` — text limits, emoji, INR formatting

### Module 1.3 — Audit & idempotency

**New tables** (see `release6.0/schema-draft.prisma`):

| Model | Purpose |
|-------|---------|
| `ChannelAccount` | Maps `channel` + `externalUserId` → `userId` |
| `BotRequest` | Idempotency: `channel + externalMessageId` unique |
| `ConversationSession` | Multi-step flows (amount → category → confirm) |
| `ConversationMessage` | Optional history for debugging |

- [ ] Idempotency key: reject duplicate webhook deliveries
- [ ] Audit: command, userId, channel, status, requestId

### M1 acceptance criteria

```text
✓ Test script: CREATE_EXPENSE → Transaction row in DB
✓ Duplicate idempotency key → no second row
✓ Expired trial user → 402-equivalent bot error message
✓ formatters produce Telegram + WhatsApp strings from same BotResponse
```

---

## Phase 2 — OpenWA Infrastructure (Week 3)

**Milestone M2:** Self-hosted WhatsApp gateway → PaySaSuchan webhook.

### Module 2.1 — Deployment

- [ ] `infrastructure/openwa/` — Docker Compose (OpenWA, Postgres, Redis, volumes)
- [ ] Health checks, logging, session volume backup notes
- [ ] Staging + production env templates (no secrets in git)

### Module 2.2 — WhatsApp provisioning

- [ ] Dedicated PaySaSuchan number
- [ ] Session create → QR → pair → verify status
- [ ] Outbound test message via REST API

### Module 2.3 — Security hardening

- [ ] Production API keys (least privilege, session-scoped)
- [ ] HTTPS behind reverse proxy
- [ ] Webhook HMAC enabled; SSRF protection; body size limits
- [ ] Rate limiting; disable Swagger in prod
- [ ] **Filesystem protection for session volume** (OpenWA stores session unencrypted on disk)

### Module 2.4 — Webhook integration

- [ ] `POST /api/webhooks/whatsapp` (or `/api/bot/whatsapp/webhook`)
- [ ] Verify `X-OpenWA-Signature` (HMAC-SHA256)
- [ ] Handle `message.received` initially; log `session.status`

### M2 acceptance criteria

```text
✓ WhatsApp ↔ OpenWA ↔ nexpo webhook round-trip
✓ Invalid HMAC → 401
✓ Valid message → normalized payload logged or enqueued
✓ Outbound reply delivered to WhatsApp
```

---

## Phase 3 — Telegram Infrastructure (Week 3, parallel with 2)

**Milestone M3:** grammY bot operational.

### Module 3.1 — Bot creation

- [ ] BotFather: username, token, commands (`/start`, `/help`, `/add`, `/summary`)
- [ ] Store `TELEGRAM_BOT_TOKEN` in env / secret manager

### Module 3.2 — grammY application

Recommended location: `bot-platform/channels/telegram/` or `lib/bot/channels/telegram/`

```text
bot-platform/channels/telegram/
  ├── bot.ts
  ├── commands/
  ├── handlers/
  ├── keyboards/
  └── middleware/
```

- [ ] Dev: long polling
- [ ] Prod: webhook → `POST /api/bot/telegram/webhook`

### Module 3.3 — Security

- [ ] Webhook secret / path token
- [ ] Rate limit per Telegram user id
- [ ] Reject unlinked users (after Phase 4)

### M3 acceptance criteria

```text
✓ /start and /help work
✓ Webhook mode works in staging
✓ Unauthorized (unlinked) user gets link prompt
```

---

## Phase 4 — Identity & Account Linking (Week 4)

**Milestone M4:** WhatsApp/Telegram identities map to PaySaSuchan `User`.

### Module 4.1 — Linking flows

**Telegram**

```text
/start → not linked → "Connect PaySaSuchan" button
  → https://app.../customer/settings/bot-link?token=... (or dedicated page)
  → user logs in → confirm → ChannelAccount created
```

**WhatsApp**

```text
First message → phone from OpenWA payload → not linked
  → secure link URL in reply → login → confirm → linked
```

- [ ] `ChannelLinkToken` — one-time, short TTL, single use
- [ ] Web UI: link status + unlink in customer settings
- [ ] Commands: `/link`, `/unlink`, `/account` (Telegram); WhatsApp keyword equivalents

### Module 4.2 — Security

- [ ] No passwords in chat
- [ ] PKCE/state on OAuth-style link where applicable
- [ ] Explicit confirmation screen before bind
- [ ] Unlink revokes bot access immediately

### M4 acceptance criteria

```text
✓ Same User works on web + Telegram + WhatsApp
✓ Unlinked channel cannot read or write financial data
✓ Token reuse / expiry enforced
```

---

## Phase 5 — Common Bot Engine (Week 5)

**Milestone M5:** One engine, two channels.

### Module 5.1 — Message normalization

```typescript
// Inbound canonical shape
{
  channel: 'whatsapp' | 'telegram',
  externalUserId: string,
  messageId: string,
  text?: string,
  media?: { type, url },
  timestamp: Date,
}
```

→ resolve `userId` via `ChannelAccount` → pass to engine

### Module 5.2 — Intent routing (deterministic first)

| Pattern | Command |
|---------|---------|
| `/add`, `spent X`, `paid X` | CREATE_EXPENSE (or slot-filling) |
| `received X`, `income X` | CREATE_INCOME |
| `/summary`, `today`, `this month` | GET_*_SUMMARY |
| `last expenses` | GET_TRANSACTIONS |
| `delete last` | DELETE with confirmation |

- [ ] Regex/slash-command router before AI
- [ ] Unknown → help message

### Module 5.3 — Conversation state

- [ ] Slot-filling: amount → description → category → confirm
- [ ] Server-side `ConversationSession` (TTL e.g. 15 min)
- [ ] Telegram inline keyboards; WhatsApp numbered replies or buttons if supported

### Module 5.4 — Confirmation engine

- [ ] All CREATE/UPDATE/DELETE require explicit confirm in MVP
- [ ] Cancel clears session

### M5 acceptance criteria

```text
✓ Same text on both channels → same BotCommand → same DB outcome
✓ Multi-step expense flow completes with confirm
```

---

## Phase 6 — Core Financial Features (Week 6)

**Milestone M6:** MVP financial assistant.

### Module 6.1 — Expenses

- [ ] Natural phrasing: `Spent ₹500 on lunch`, `₹800 dinner`, `Amazon 2300`
- [ ] Fields: amount, category, description, date (default today), payment type
- [ ] Edit/delete last transaction

### Module 6.2 — Income

- [ ] `Received salary ₹120000`, `Got ₹5000 from Ravi`

### Module 6.3 — Queries

- [ ] Today / this month spend
- [ ] Category spend (e.g. food)
- [ ] Last N transactions
- [ ] Largest expense this month

### Module 6.4 — Payment types (not bank balances)

- [ ] “Show payment types” / map user words to `PaymentType`
- [ ] **Do not** promise bank account balances in MVP

### M6 acceptance criteria

```text
✓ Linked user manages personal transactions entirely via both channels
✓ Group transactions excluded (groupId null filter)
✓ Plan limits enforced on writes
```

---

## Phase 7 — Reporting & Analytics (Week 7)

**Milestone M7:** Conversational reporting.

- [ ] Today, yesterday, this week, this month, last month
- [ ] Category breakdown with % of spend
- [ ] Simple comparisons (this month vs last month)
- [ ] Reuse `ReportService` + `lib/ai/aggregates.ts`

**Deferred:** Budget status (no budget entity).

---

## Phase 8 — AI Financial Assistant (Week 8)

**Milestone M8:** Natural language after deterministic paths are stable.

- [ ] Intent + entity extraction via existing `lib/ai/` stack (`modelFor('structured')`)
- [ ] Multi-transaction utterances → array of commands → batch confirm
- [ ] Ambiguity → ask, don’t guess
- [ ] Adversarial prompts → refuse; no cross-user data
- [ ] Reuse patterns from `createFinanceTools` — read-only tools for AI; mutations via command engine only

---

## Phase 9 — Voice & Media (Weeks 9–10, post-MVP)

- [ ] WhatsApp voice → STT → parser → commands
- [ ] Image receipt → existing OCR route → confirm expense
- [ ] Shared media pipeline for Telegram

---

## Phase 10 — Security & Hardening (Week 10)

Formal checklist — test each item:

- [ ] HTTPS everywhere
- [ ] Secrets not in git; rotation runbook
- [ ] OpenWA: API key roles, HMAC, rate limits, CORS, SSRF
- [ ] Webhook replay protection (idempotency + timestamp window)
- [ ] Input validation on all bot commands
- [ ] Error messages sanitized (no stack traces to users)
- [ ] PII masking in logs
- [ ] Billing + bot audit trail
- [ ] Backup/recovery for OpenWA session volume

---

## Phase 11 — Testing & UAT (Week 11)

### Channel test matrix

| Case | WhatsApp | Telegram |
|------|----------|----------|
| New user → link | ✓ | ✓ |
| Add expense | ✓ | ✓ |
| Duplicate webhook | one txn | one txn |
| Invalid HMAC / auth | 401 | 401 |
| Trial expired write | upgrade msg | upgrade msg |
| Delete with confirm | ✓ | ✓ |
| Adversarial AI prompt | safe refusal | safe refusal |

- [ ] Integration tests for `BotCommandEngine`
- [ ] Webhook signature tests
- [ ] Manual UAT script in `release6.0/uat-checklist.md`

---

## Phase 12 — Production Rollout (Week 12)

| Stage | Audience |
|-------|----------|
| 1 | Internal devs |
| 2 | 5–10 trusted users |
| 3 | 25–50 beta |
| 4 | Public beta |
| 5 | General availability |

- [ ] Feature flag: `BOT_CHANNELS_ENABLED`
- [ ] Monitoring: webhook latency, OpenWA session health, error rate
- [ ] Analytics: `ps_bot_*` events (mirror `ps_billing` pattern)
- [ ] Runbook: OpenWA session disconnect / re-pair

---

## Recommended repo structure

Add under existing monorepo (do not fork financial logic):

```text
nexpo/
├── app/api/bot/              # Webhooks + link callbacks
├── app/customer/settings/    # Bot link UI
├── lib/bot/
│   ├── core/
│   │   ├── commands/
│   │   ├── engine.ts
│   │   ├── conversation/
│   │   ├── formatters/
│   │   └── intents/
│   ├── channels/
│   │   ├── whatsapp/openwa/
│   │   └── telegram/grammy/
│   └── auth/linking.ts
├── infrastructure/openwa/      # Docker, deploy notes
└── release6.0/               # This plan + schema + UAT
```

Optional: extract `bot-platform/` to separate deployable later; keep `lib/bot` as shared package.

---

## MVP boundary

**In MVP**

- Account linking (both channels)
- Expense + income CRUD with confirmation
- Today / month / category queries
- Deterministic commands + basic NL patterns
- Plan/billing enforcement
- Security: HMAC, idempotency, audit

**Out of MVP**

- Voice messages
- Receipt OCR via chat
- Budgets
- Group splits via bot
- Bank account balances
- Advanced AI multi-turn advisor
- Export via bot

---

## Delivery timeline

| Milestone | Deliverable | Week |
|-----------|-------------|------|
| M0 | Ground-zero assessment | 1 |
| M1 | Command engine + schema | 2 |
| M2 | OpenWA deployed + secured | 3 |
| M3 | Telegram + grammY | 3 |
| M4 | Account linking | 4 |
| M5 | Common bot engine | 5 |
| M6 | Expense/income MVP | 6 |
| M7 | Reports | 7 |
| M8 | AI natural language | 8 |
| M9 | Voice/media | 9–10 |
| M10 | Security hardening | 10 |
| M11 | UAT | 11 |
| M12 | Production rollout | 12 |

---

## Implementation priority (strict order)

1. **P0** — Phase 0 discovery sign-off  
2. **P1** — Bot command engine (no channels)  
3. **P2** — OpenWA deploy + webhook  
4. **P3** — grammY bot + webhook  
5. **P4** — Identity linking  
6. **P5** — Unified conversation engine  
7. **P6** — Financial MVP commands  
8. **P7** — Reports  
9. **P8** — AI layer  
10. **P9** — Voice/media  
11. **P10** — Security, UAT, rollout  

---

## Next action

**Start Phase 0 Module 0.1:** finalize API inventory and create `release6.0/schema-draft.prisma` before any OpenWA production deploy.

