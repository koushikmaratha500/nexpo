# Release 6.0 — WhatsApp + Telegram + Tines Orchestration

> **Purpose:** Conversational PaySaSuchan on **WhatsApp (OpenWA)** and **Telegram (grammY)**, orchestrated by **Tines**, with PaySaSuchan as the financial system of record.
>
> **Builds on:** Release 5.0 billing, Release 4.x transactions/groups/reports/AI, layered API (`AGENTS.md`), Trigger.dev (existing scheduled jobs).
>
> **Change requests incorporated:**
> - **CR-1:** OpenWA + grammY are **Ground Zero** (deploy, pair, secure, integrate from scratch). Component name is **OpenWA**, not OpenQA.
> - **CR-2:** Introduce **Tines** as orchestration/workflow layer; **small Core Command API + event contract** instead of bots calling dozens of REST endpoints directly.

---

## How to use this document

1. Work **phase by phase** — dependencies are strict (see WBS).
2. Mark tasks: `[ ]` todo · `[~]` in progress · `[x]` done · `[—]` deferred.
3. Classify every task: **Core API** · **Event** · **Tines** · **Channel** · **Infra**.
4. Schema: `prisma migrate` + `release6.0/schema-draft.prisma`.
5. **Gate:** Phase 1 Command API must pass unit tests **before** Tines channel wiring.

**Related docs**

| Doc | Role |
|-----|------|
| `release6.0/wbs.md` | Task breakdown with layer, hours, dependencies |
| `release6.0/events-contract.md` | Event naming, payload schema, producers/consumers |
| `release6.0/tines-stories.md` | Tines Story inventory and sub-stories |
| `release6.0/schema-draft.prisma` | Bot + event outbox tables |
| `release6.0/uat-checklist.md` | End-to-end UAT matrix |
| `AGENTS.md` | Layered architecture conventions |
| `release5.0/billing-go-live-checklist.md` | Plan gating (402 on writes) |

---

## Design philosophy

| Layer | Answers |
|-------|---------|
| **PaySaSuchan Core** | “Is this financially valid, and how should financial data change?” |
| **Event layer** | “What happened?” (immutable facts for downstream automation) |
| **Tines** | “What should happen next?” (orchestration, notifications, AI routing, schedules) |
| **OpenWA / grammY** | “How do we talk to the user on this channel?” (transport only) |

**Do not:**

- Make Tines the database or ledger.
- Let Tines or AI write financial data directly.
- Make OpenWA/grammY the application backend.

**Do:**

- Route all mutations through **Core Command API** → services → Prisma.
- Emit domain events after successful commits.
- Use Tines for message workflows, confirmations, alerts, scheduled summaries, integrations.

---

## North Star architecture

```text
                 PAY SASUCHAN CORE (nexpo)
         Web · Mobile · Admin · Command API · Services
                              │
                    ┌─────────▼─────────┐
                    │  Prisma / Postgres │
                    │  Auth · Rules      │
                    │  PlanService       │
                    │  Idempotency       │
                    └─────────┬─────────┘
                              │
                         DOMAIN EVENTS
                    (expense.created, etc.)
                              │
                    ┌─────────▼─────────┐
                    │      TINES        │
                    │  Orchestration    │
                    │  Automation · AI  │
                    │  Notifications    │
                    └─────────┬─────────┘
          ┌───────────────────┼───────────────────┐
          │                   │                   │
     ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
     │ OpenWA  │        │  grammY   │       │   Email   │
     │WhatsApp │        │ Telegram  │       │  Resend   │
     └─────────┘        └───────────┘       └───────────┘
```

### Synchronous path (user waiting)

```text
WhatsApp/Telegram → OpenWA/grammY → Tines webhook Story
  → normalize → resolve user → intent → (confirm?) → Core Command API
  → DB → event emitted → Tines response Story → channel reply
```

### Asynchronous path (automation)

```text
expense.created → Tines ingestion → budget check / large-txn alert / analytics
  → notification.required → WhatsApp / Telegram / Email
```

### Trigger.dev vs Tines

| Concern | Owner |
|---------|-------|
| Billing lifecycle dispatch | **Trigger.dev** (existing) |
| Reminder due dispatch | **Trigger.dev** (existing) |
| Bot message orchestration | **Tines** |
| Daily/monthly bot summaries | **Tines** (scheduled Stories) |
| Budget / large-expense alerts | **Tines** (event-driven Stories) |
| Recurring expense automation (future) | **Tines** (preferred) or Trigger.dev |

Keep Trigger.dev for durable in-app cron already deployed; add Tines for bot-centric and integration workflows.

---

## Executive summary

| Item | Decision |
|------|----------|
| WhatsApp | **OpenWA** — Ground Zero, self-hosted |
| Telegram | **grammY** — Ground Zero |
| Orchestration | **Tines** — Ground Zero tenant + Stories |
| Financial core | nexpo services via **Command API** |
| Database | **Prisma + Postgres** (Supabase = OAuth + storage only) |
| Income | `Transaction` `type: CREDIT` |
| Expenses | `Transaction` `type: DEBIT` |
| Bank accounts | Not in schema — `PaymentType` + report aggregates |
| Groups | APIs exist; **bot MVP = personal only**; group bot = fast-follow |
| Timeline | **10–12 weeks MVP** (+2 weeks for Tines + events vs CR-1-only plan) |

---

## Corrections: generic draft → nexpo reality

| Draft | Nexpo actual |
|-------|--------------|
| Supabase + RLS | Prisma; app-layer auth + `PlanService` |
| Greenfield `/api/v1/*` | Thin **Command API** wrapping existing services |
| Separate income table | `Transaction` with `type: CREDIT` |
| `GET /api/v1/accounts` | Payment types + `ReportService` aggregates |
| Edge Functions | Next.js routes + Trigger.dev |
| OpenQA | **OpenWA** |
| Bot engine in-process only | Tines orchestrates; Core executes commands |

---

## Functionality placement matrix

| Functionality | Layer | Notes |
|---------------|-------|-------|
| Create/update/delete transaction | **Core API** | `TransactionService`, atomic |
| Balance / report calculation | **Core API** | `ReportService` |
| Authorization / plan gates | **Core API** | `PlanService` |
| Idempotency / audit | **Core API** | `BotRequest` + service audits |
| Emit `expense.created` etc. | **Event** | Outbox → Tines webhook |
| WhatsApp message ingest | **Tines** | OpenWA webhook → Story |
| Telegram message ingest | **Tines** + thin grammY adapter | Webhook → Tines (or grammY → Tines) |
| NL classification | **Tines AI** or Core AI endpoint | Structured command output only |
| Confirmation workflow | **Tines** | State in Tines or Core session table |
| Daily/monthly summary push | **Tines** | Scheduled Story → Command API read |
| Budget / large-txn alerts | **Tines** | Subscribe to events |
| Notification routing | **Tines** | `notification.required` handler |
| OpenWA deploy / HMAC | **Infra** | `infrastructure/openwa/` |
| Account linking UI | **Core** | Web + `ChannelAccount` schema |
| Voice / receipt OCR | **Post-MVP** | Tines media pipeline → Core OCR |

---

# PHASE 0 — Ground Zero (Week 1)

**M0:** Audit complete; OpenWA, grammY, Tines POCs pass.

| Module | Tasks | Layer |
|--------|-------|-------|
| 0.1 | PaySaSuchan architecture + API inventory | Core |
| 0.2 | Financial model audit (Transaction, groups, reports) | Core |
| 0.3 | Auth + plan gating audit | Core |
| 0.4 | Security baseline (secrets, rate limits, audit) | Core |
| 0.5 | OpenWA local deploy + QR pair + send/receive | Infra |
| 0.6 | OpenWA webhook + HMAC POC | Infra |
| 0.7 | Telegram BotFather + grammY hello-world | Channel |
| 0.8 | **Tines tenant + webhook POC** (echo Story) | Tines |
| 0.9 | **Event architecture POC** (sample `expense.created` payload) | Event |
| 0.10 | Security architecture doc (OpenWA volume, Tines secrets) | Infra |

### Feature capability matrix (pre-filled)

| Feature | Core API? | Bot MVP? | Layer | Work |
|---------|-----------|----------|-------|------|
| Add expense (DEBIT) | Yes | Yes | Core + Tines | Command + workflow |
| Add income (CREDIT) | Yes | Yes | Core + Tines | Command + workflow |
| Edit/delete transaction | Yes | Yes | Core + Tines | Confirm in Tines |
| List transactions | Yes | Yes | Core | Query command |
| Categories / payment types | Yes | Yes | Core | Meta resolution |
| Monthly/daily summary | Yes | Yes | Core read; Tines format | Report command |
| Account linking | No | Yes | Core schema + Tines | Link flow |
| Group CRUD / group txn | Yes | Later | Core + Tines | Fast-follow |
| Budget alerts | No entity | Later | Tines on events | Post-MVP |
| Recurring via bot | Limited | Later | Tines scheduled | Post-MVP |
| Voice / OCR | Yes (OCR) | Later | Tines + Core | Phase 10+ |

### M0 acceptance

```text
✓ Architecture documented (release6.0/)
✓ OpenWA: message in/out + HMAC verified (local)
✓ grammY: /start reply (local)
✓ Tines: webhook received and HTTP response returned
✓ Event contract draft approved
✓ No production credentials in POC
```

---

# PHASE 1 — Core Financial Command API (Week 2)

**M1:** Channel-independent command execution — **no Tines/channels required**.

### Module 1.1 — Command API

`POST /api/internal/bot/command` (or `/api/v1/commands`)

- Auth: `BOT_COMMAND_SECRET` / mTLS / signed service token
- Body: canonical command JSON (see `events-contract.md`)
- Flow: Validate → Authorize (`userId`) → Idempotency → `PlanService` → Service → Audit → Response

| Command | Service |
|---------|---------|
| `CREATE_EXPENSE` | `TransactionService.create` (DEBIT, `groupId: null`) |
| `CREATE_INCOME` | `TransactionService.create` (CREDIT) |
| `UPDATE_TRANSACTION` | `TransactionService.update` |
| `DELETE_TRANSACTION` | `TransactionService.delete` |
| `GET_TRANSACTIONS` | `TransactionRepository.findAll` |
| `GET_DAILY_SUMMARY` | `ReportService` / aggregates |
| `GET_WEEKLY_SUMMARY` | Same |
| `GET_MONTHLY_SUMMARY` | Same |
| `GET_CATEGORY_SUMMARY` | Report + filter |
| `LIST_GROUPS` | `GroupService.listGroups` (fast-follow) |
| `CREATE_GROUP` | `GroupService.createGroup` (fast-follow) |
| `ADD_GROUP_EXPENSE` | `GroupTransactionService` (fast-follow) |

### Module 1.2 — Bot command engine (`lib/bot/core/`)

- [ ] Zod schemas per command
- [ ] `BotCommandEngine.execute()` — used by Command API route
- [ ] Channel-neutral `BotResponse` + formatters (for Tines to call or reuse)

### Module 1.3 — Idempotency & audit

Tables: `ChannelAccount`, `BotRequest`, `ConversationSession` (see schema-draft).

- Idempotency key: `channel + externalMessageId` (set by Tines in command payload)

### M1 acceptance

```text
✓ curl/script → CREATE_EXPENSE → DB row
✓ Duplicate idempotency → no double insert
✓ Trial expired → structured error (402 semantics)
✓ No WhatsApp/Telegram/Tines in test path
```

---

# PHASE 2 — Event Architecture (Week 3)

**M2:** PaySaSuchan emits standard domain events after successful commits.

### Module 2.1 — Event schema

See `release6.0/events-contract.md`. Minimum MVP events:

```text
expense.created | expense.updated | expense.deleted
income.created  | income.updated
user.linked | user.unlinked
message.processed | message.failed
notification.required
```

### Module 2.2 — Event producer (Core)

- [ ] `DomainEventService.emit()` after transaction mutations
- [ ] **Outbox pattern** (`DomainEventOutbox` table) for reliability
- [ ] Dispatcher: POST to Tines webhook(s) with retry + dead-letter logging
- [ ] `event_id`, `correlation_id`, `event_version` on every payload

### Module 2.3 — Event consumer contract

- Tines Stories subscribe via webhook actions
- Core never depends on Tines for commit path

### M2 acceptance

```text
✓ CREATE_EXPENSE → outbox row → Tines receives expense.created
✓ Failed Tines delivery → retry; outbox remains until ack
✓ correlation_id traces message → command → event
```

---

# PHASE 3 — Tines Foundation (Week 3–4)

**M3:** Tines tenant ready for production Stories.

| Module | Tasks |
|--------|-------|
| 3.1 | Tenant + env strategy (dev/staging/prod) |
| 3.2 | Credential vault (OpenWA key, bot token, Command API secret) |
| 3.3 | Webhook standards (auth, rate limit, IP allowlist) |
| 3.4 | Reusable sub-stories: HTTP to Command API, error handler, formatter |
| 3.5 | Logging + monitoring + failure paths |
| 3.6 | Workflow-as-API for sync queries (Tines API exit action) |

See `release6.0/tines-stories.md` for Story list.

### M3 acceptance

```text
✓ Sub-story: call Command API with test command
✓ Sub-story: format BotResponse → WhatsApp text
✓ Webhook auth rejects unsigned requests
```

---

# PHASE 4 — WhatsApp / OpenWA (Week 4–5)

**M4:** OpenWA Ground Zero — deploy, pair, secure, integrate with Tines.

| Module | Tasks | Layer |
|--------|-------|-------|
| 4.1 | Docker deploy (API, Postgres, Redis, session volume) | Infra |
| 4.2 | Dedicated number; QR pair; session health | Infra |
| 4.3 | Security hardening (API keys, HMAC, HTTPS, rate limits, volume protection) | Infra |
| 4.4 | OpenWA webhook → **Tines** (not directly to Core) | Tines |
| 4.5 | Tines → OpenWA REST for outbound messages | Tines |
| 4.6 | HMAC validation in Tines or thin nexpo verify proxy | Infra/Tines |

**Note:** OpenWA session state is **unencrypted on disk** — volume security is mandatory.

### M4 acceptance

```text
✓ WhatsApp → OpenWA → Tines → (test echo)
✓ Invalid HMAC rejected
✓ Outbound reply via Tines → OpenWA → WhatsApp
✓ Production config hardened
```

---

# PHASE 5 — Telegram / grammY (Week 5, parallel)

**M5:** grammY Ground Zero — bot, webhook, Tines integration.

| Module | Tasks |
|--------|-------|
| 5.1 | BotFather: token, commands, description |
| 5.2 | grammY app (`lib/bot/channels/telegram/` or sidecar) |
| 5.3 | Dev: long polling → forward to Tines; Prod: Telegram webhook → grammY → Tines |
| 5.4 | Security: token in vault, rate limit, callback validation |

**Architecture choice:** grammY remains a **thin adapter** that normalizes Telegram updates and forwards to Tines; heavy logic stays in Tines sub-stories.

### M5 acceptance

```text
✓ /start → Tines → response
✓ Webhook mode in staging
✓ Secrets not in source control
```

---

# PHASE 6 — Identity & Account Linking (Week 5–6)

**M6:** `ChannelAccount` maps external IDs → PaySaSuchan `User`.

| Flow | Path |
|------|------|
| Telegram `/start` | Tines → link URL → web login → confirm → `user.linked` event |
| WhatsApp first message | Tines → phone from OpenWA → link URL → confirm |
| Commands | `/link`, `/unlink`, `/account` via Tines routing |

- [ ] `ChannelLinkToken` — one-time, TTL, single use
- [ ] Customer settings UI for link status + unlink
- [ ] Tines rejects unlinked users before Command API calls

### M6 acceptance

```text
✓ Same User on web + WhatsApp + Telegram
✓ Unlinked → no financial commands
✓ user.linked / user.unlinked events emitted
```

---

# PHASE 7 — Common Bot Workflow (Week 6–7)

**M7:** One Tines master Story (or sub-story chain) for both channels.

```text
message.received
  → normalize (canonical payload)
  → resolve ChannelAccount → userId
  → intent (deterministic regex/slash first)
  → slot-fill / ConversationSession (Core or Tines state)
  → confirmation (inline buttons / numbered reply)
  → Command API
  → format response
  → outbound channel action
```

### Deterministic intents (MVP)

| Input | Command |
|-------|---------|
| `/add`, `spent X`, `paid X` | CREATE_EXPENSE |
| `received X`, `income X` | CREATE_INCOME |
| `/summary`, `today`, `this month` | GET_*_SUMMARY |
| `last N expenses` | GET_TRANSACTIONS |
| `delete last` | DELETE (confirm) |

### M7 acceptance

```text
✓ Same utterance on WA + TG → same command → same DB outcome
✓ Multi-step expense with confirm
✓ AI not required for MVP path
```

---

# PHASE 8 — Financial MVP Features (Week 7–8)

**M8:** Personal expense/income CRUD + queries via bot.

- Expenses: amount, category, description, date, payment type, merchant
- Income: salary, freelance, received-from-person
- Queries: today, month, category, last N, largest expense
- Corrections: edit/delete last transaction
- **Personal only** (`groupId: null`) in MVP

### M8 acceptance

```text
✓ Full personal transaction lifecycle via both channels
✓ PlanService write gates enforced
```

---

# PHASE 9 — Reporting & Automation (Week 8–9)

**M9:** Conversational reports + Tines scheduled/event workflows.

### Module 9.1 — Conversational reports (sync)

- Today, yesterday, week, month, last month, category %, month-over-month
- Tines calls Command API read commands; formats rich replies

### Module 9.2 — Tines automation (async)

| Workflow | Trigger | Layer |
|----------|---------|-------|
| Daily summary push | Tines schedule | Tines |
| Weekly summary | Tines schedule | Tines |
| Monthly report + AI narrative | Tines schedule | Tines + AI |
| Large expense alert | `expense.created` | Tines |
| Budget threshold alert | `expense.created` | Tines (when budget entity exists) |
| `notification.required` router | Event | Tines → WA/TG/Email |

### M9 acceptance

```text
✓ “How much on food this month?” → correct report
✓ Scheduled daily summary delivered to opted-in users
✓ expense.created > threshold → alert message
```

---

# PHASE 10 — AI Assistant (Week 9–10)

**M10:** NL understanding in Tines workflow (post-deterministic).

```text
Message → Tines AI action (or Core /api/internal/bot/parse)
  → structured command(s) → validate → confirm → Command API
```

- Multi-transaction utterances → batch confirm
- Ambiguity → ask; never guess amounts/categories
- Adversarial prompts → refuse
- Reuse `lib/ai/` models; **AI never writes DB directly**

### M10 acceptance

```text
✓ “Yesterday dinner 850” → correct dated expense after confirm
✓ Injection attempts safely refused
```

---

# PHASE 11 — Voice, Media & Integrations (Week 10–11, post-MVP)

- WhatsApp voice → STT → Tines → parser → commands
- Receipt image → Core OCR route → Tines confirm flow
- Future: Google Calendar, Sheets, banks via Tines HTTP actions

---

# PHASE 12 — Security & Hardening (Week 11)

Checklist (Core + Tines + OpenWA):

```text
□ HTTPS everywhere
□ Secrets in vault (Tines + Vercel env)
□ OpenWA: prod API keys, HMAC, SSRF, rate limits, session volume
□ Command API: service auth only; no public exposure
□ Webhook replay protection (idempotency + timestamp)
□ Prisma parameterized queries; input validation
□ Audit logging (Core + Tines action logs)
□ PII masking in logs
□ Financial confirm on all mutations
□ Backup/recovery for OpenWA session volume
□ Tines failure paths + alerting
```

---

# PHASE 13 — UAT & Production Rollout (Week 12)

| Stage | Audience |
|-------|----------|
| 1 | Internal devs |
| 2 | 5–10 trusted users |
| 3 | 25–50 beta |
| 4 | Public beta |
| 5 | GA |

- [ ] `BOT_CHANNELS_ENABLED` feature flag
- [ ] Monitoring: Tines run logs, OpenWA session, Command API latency, outbox lag
- [ ] Analytics: `ps_bot_*` events
- [ ] UAT: `release6.0/uat-checklist.md`

---

## Repo structure

```text
nexpo/
├── app/api/internal/bot/       # Command API + parse endpoint
├── app/api/webhooks/           # Optional: OpenWA verify proxy → Tines
├── app/customer/settings/      # Bot link UI
├── lib/bot/
│   ├── core/                   # Command engine, schemas, formatters
│   ├── events/                 # DomainEventService, outbox dispatcher
│   └── channels/telegram/      # Thin grammY adapter
├── infrastructure/
│   ├── openwa/                 # Docker Compose, runbooks
│   └── tines/                  # Story export notes, webhook URLs
├── release6.0/
│   ├── plan.md
│   ├── wbs.md
│   ├── events-contract.md
│   ├── tines-stories.md
│   ├── schema-draft.prisma
│   └── uat-checklist.md
└── trigger/                    # Existing — billing, reminders (unchanged)
```

---

## MVP boundary

**In MVP (Weeks 1–12)**

- Core Command API + idempotency + audit
- Domain events + Tines ingestion
- OpenWA + grammY Ground Zero
- Account linking
- Tines bot workflow (deterministic + confirm)
- Personal expense/income CRUD + summaries
- Daily/monthly conversational reports
- Large-expense alert (Tines on `expense.created`)
- Security hardening + UAT

**Out of MVP**

- Voice messages
- Receipt OCR via chat
- Group bot commands
- Budget entity + budget alerts
- Recurring transaction automation
- Bank integrations
- Advanced AI advisor

**Fast-follow (Phase 8b)**

- Group list/create/add expense via bot
- Budget workflows when budget schema lands

---

## Delivery timeline

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| 1 | M0 | Ground zero + POCs |
| 2 | M1 | Command API + engine |
| 3 | M2 | Event layer + outbox |
| 3–4 | M3 | Tines foundation |
| 4–5 | M4 | OpenWA production-ready |
| 5 | M5 | grammY + Tines |
| 5–6 | M6 | Account linking |
| 6–7 | M7 | Common bot workflow |
| 7–8 | M8 | Financial MVP |
| 8–9 | M9 | Reports + automation |
| 9–10 | M10 | AI layer |
| 10–11 | M11 | Voice/media (optional) |
| 11 | M12 | Security |
| 12 | M13 | UAT + rollout |

**Estimate:** 10–12 weeks MVP; 14–16 weeks with voice, groups bot, rich AI.

---

## Implementation priority

1. **P0** — Ground zero (Core + OpenWA + grammY + Tines POCs)
2. **P1** — Core Command API (no channels)
3. **P2** — Event architecture
4. **P3** — Tines foundation + sub-stories
5. **P4** — OpenWA → Tines
6. **P5** — grammY → Tines
7. **P6** — Identity linking
8. **P7** — Common bot workflow
9. **P8** — Financial MVP
10. **P9** — Reports + Tines automation
11. **P10** — AI
12. **P11** — Security, UAT, rollout

---

## Next action

1. Sign off Phase 0 feature matrix.
2. Implement Command API (Phase 1) before wiring Tines to OpenWA.
3. Draft Tines tenant + import sub-stories from `tines-stories.md`.
