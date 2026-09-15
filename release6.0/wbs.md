# Release 6.0 — Work Breakdown Structure

> **Layer key:** `Core` · `Event` · `Tines` · `Channel` · `Infra`  
> **Owner key:** `BE` backend · `DO` DevOps · `QA` · `PM`  
> Hours are estimates for 1 FTE; adjust for team size.

---

## P0 — Ground Zero (Week 1) · 40h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P0.1 | Document API inventory (transactions, reports, groups, billing) | Core | BE | 6 | — |
| P0.2 | Document auth + PlanService write gates | Core | BE | 4 | — |
| P0.3 | Security baseline doc (secrets, rate limits, audit) | Core | BE | 4 | — |
| P0.4 | OpenWA local Docker deploy | Infra | DO | 8 | — |
| P0.5 | OpenWA QR pair + send/receive test | Infra | DO | 4 | P0.4 |
| P0.6 | OpenWA webhook + HMAC POC | Infra | BE | 4 | P0.5 |
| P0.7 | BotFather bot + grammY hello-world | Channel | BE | 4 | — |
| P0.8 | Tines tenant + echo webhook Story | Tines | BE | 4 | — |
| P0.9 | Draft event contract review | Event | BE | 2 | — |
| P0.10 | Sign off MVP scope + feature matrix | PM | PM | 4 | P0.1 |

**Gate:** P0.4–P0.8 POCs pass; no prod credentials.

---

## P1 — Core Command API (Week 2) · 48h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P1.1 | Prisma migrate: ChannelAccount, BotRequest, ConversationSession | Core | BE | 6 | P0.10 |
| P1.2 | BotCommand Zod schemas (all MVP commands) | Core | BE | 8 | P1.1 |
| P1.3 | BotCommandEngine.execute() | Core | BE | 12 | P1.2 |
| P1.4 | POST /api/internal/bot/command route + auth | Core | BE | 6 | P1.3 |
| P1.5 | Wire PlanService + idempotency | Core | BE | 6 | P1.3 |
| P1.6 | BotResponse + WhatsApp/Telegram formatters | Core | BE | 4 | P1.3 |
| P1.7 | Unit tests: create/list/summary/delete | Core | BE | 6 | P1.4 |

**Gate:** P1.7 green without any channel/Tines.

---

## P2 — Event Architecture (Week 3) · 32h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P2.1 | DomainEventOutbox schema + migration | Event | BE | 4 | P1.1 |
| P2.2 | DomainEventService.emit() in TransactionService | Event | BE | 8 | P2.1, P1.3 |
| P2.3 | Outbox dispatcher (Trigger.dev or cron) | Event | BE | 8 | P2.2 |
| P2.4 | Tines STORY-03 event-ingest webhook | Tines | BE | 6 | P0.8, P2.3 |
| P2.5 | correlation_id propagation end-to-end | Event | BE | 4 | P2.2 |
| P2.6 | Integration test: command → outbox → Tines | Event | BE | 2 | P2.4 |

**Gate:** expense.created received in Tines within 60s of command.

---

## P3 — Tines Foundation (Week 3–4) · 36h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P3.1 | Tines env strategy (dev/staging/prod) | Tines | DO | 4 | P0.8 |
| P3.2 | SUB-01 call-command-api sub-story | Tines | BE | 6 | P1.4 |
| P3.3 | SUB-02/03 formatters sub-stories | Tines | BE | 4 | P1.6 |
| P3.4 | SUB-09 error-handler sub-story | Tines | BE | 4 | P3.2 |
| P3.5 | SUB-06 resolve-user (ChannelAccount API) | Core | BE | 6 | P1.1 |
| P3.6 | SUB-06 wired in Tines | Tines | BE | 4 | P3.5 |
| P3.7 | Webhook auth + rate limit config | Tines | DO | 4 | P3.1 |
| P3.8 | Tines monitoring + failure alerts | Tines | DO | 4 | P3.2 |

---

## P4 — OpenWA (Week 4–5) · 40h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P4.1 | Staging OpenWA deploy + volume backup | Infra | DO | 8 | P0.4 |
| P4.2 | Production hardening checklist | Infra | DO | 8 | P4.1 |
| P4.3 | Dedicated WhatsApp number + pair | Infra | PM | 2 | P4.1 |
| P4.4 | STORY-01 whatsapp-inbound | Tines | BE | 8 | P3.2, P4.1 |
| P4.5 | SUB-04 send-whatsapp | Tines | BE | 4 | P4.4 |
| P4.6 | HMAC validation in STORY-01 | Tines | BE | 4 | P0.6 |
| P4.7 | E2E: WA message → Tines echo | Channel | BE | 4 | P4.4, P4.5 |
| P4.8 | OpenWA runbook (re-pair, session down) | Infra | DO | 2 | P4.2 |

---

## P5 — Telegram / grammY (Week 5) · 28h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P5.1 | grammY thin adapter | Channel | BE | 6 | P0.7 |
| P5.2 | STORY-02 telegram-inbound | Tines | BE | 6 | P3.2 |
| P5.3 | SUB-05 send-telegram | Tines | BE | 4 | P5.2 |
| P5.4 | Prod webhook config | Channel | DO | 4 | P5.1 |
| P5.5 | E2E: TG /start → Tines echo | Channel | BE | 4 | P5.2, P5.3 |
| P5.6 | BotFather commands menu | Channel | PM | 2 | P5.1 |
| P5.7 | Rate limit + callback validation | Channel | BE | 2 | P5.2 |

---

## P6 — Account Linking (Week 5–6) · 32h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P6.1 | ChannelLinkToken schema + service | Core | BE | 6 | P1.1 |
| P6.2 | Web UI: link / unlink in customer settings | Core | BE | 8 | P6.1 |
| P6.3 | STORY-11 account-link in Tines | Tines | BE | 8 | P6.1, P3.2 |
| P6.4 | user.linked / user.unlinked events | Event | BE | 4 | P2.2, P6.1 |
| P6.5 | Reject unlinked in STORY-10 | Tines | BE | 2 | P6.3 |
| P6.6 | Link flow UAT (both channels) | QA | QA | 4 | P6.3, P4.7, P5.5 |

---

## P7 — Common Bot Workflow (Week 6–7) · 40h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P7.1 | SUB-07 intent-deterministic | Tines | BE | 8 | P3.2 |
| P7.2 | STORY-12 confirmation flow | Tines | BE | 8 | P7.1 |
| P7.3 | STORY-10 bot-master assembly | Tines | BE | 12 | P7.1, P7.2, P6.5 |
| P7.4 | ConversationSession in Core (optional sync) | Core | BE | 6 | P1.1 |
| P7.5 | Cross-channel parity tests | QA | QA | 6 | P7.3 |

---

## P8 — Financial MVP (Week 7–8) · 36h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P8.1 | CREATE_EXPENSE slot-filling + NL patterns | Tines | BE | 8 | P7.3 |
| P8.2 | CREATE_INCOME patterns | Tines | BE | 4 | P7.3 |
| P8.3 | GET_TRANSACTIONS / summaries | Tines | BE | 6 | P7.3 |
| P8.4 | Edit/delete last transaction | Tines | BE | 6 | P7.2 |
| P8.5 | Plan lock error UX in Tines | Tines | BE | 4 | P3.4 |
| P8.6 | Financial MVP UAT | QA | QA | 8 | P8.1–P8.4 |

---

## P9 — Reports & Automation (Week 8–9) · 32h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P9.1 | Conversational report intents | Tines | BE | 8 | P8.3 |
| P9.2 | STORY-21 daily-summary schedule | Tines | BE | 6 | P2.4 |
| P9.3 | STORY-20 large-expense-alert | Tines | BE | 4 | P2.4 |
| P9.4 | STORY-24 notification-router | Tines | BE | 6 | P2.4 |
| P9.5 | STORY-22/23 weekly/monthly (optional MVP) | Tines | BE | 8 | P9.2 |

---

## P10 — AI Layer (Week 9–10) · 28h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P10.1 | POST /api/internal/bot/parse (structured) | Core | BE | 8 | P1.3 |
| P10.2 | SUB-08 intent-ai in Tines | Tines | BE | 8 | P10.1 |
| P10.3 | Multi-txn batch confirm | Tines | BE | 6 | P10.2 |
| P10.4 | Adversarial prompt test suite | QA | QA | 6 | P10.2 |

---

## P11 — Security (Week 11) · 24h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P11.1 | Security checklist execution | Infra | DO | 8 | P4–P10 |
| P11.2 | Pen-test bot webhook surfaces | QA | QA | 8 | P11.1 |
| P11.3 | PII log masking | Core | BE | 4 | P11.1 |
| P11.4 | Runbooks finalized | Infra | DO | 4 | P11.1 |

---

## P12 — UAT & Rollout (Week 12) · 32h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| P12.1 | Full UAT matrix (`uat-checklist.md`) | QA | QA | 12 | P8.6 |
| P12.2 | Staged rollout (5 → 25 → beta) | PM | PM | 8 | P12.1 |
| P12.3 | ps_bot_* analytics | Core | BE | 4 | P12.2 |
| P12.4 | GA + monitoring dashboards | DO | DO | 8 | P12.2 |

---

## Fast-follow: Group bot (Week 13–14) · 24h

| ID | Task | Layer | Owner | Hrs | Deps |
|----|------|-------|-------|-----|------|
| F1.1 | LIST_GROUPS / CREATE_GROUP commands | Core | BE | 6 | P1.3 |
| F1.2 | ADD_GROUP_EXPENSE + split confirm | Core | BE | 8 | F1.1 |
| F1.3 | STORY-32 group-expense Tines workflow | Tines | BE | 10 | F1.2, P7.3 |

---

## Total estimate

| Phase | Hours |
|-------|-------|
| P0–P12 MVP | ~416h (~10–11 weeks @ 40h/wk) |
| Fast-follow groups | +24h |
| Voice/media (not detailed) | +40–60h |

---

## Critical path

```text
P0 → P1 → P2 → P3 → P4/P5 (parallel) → P6 → P7 → P8 → P9 → P11 → P12
                      P10 (AI) can start after P7, parallel with P8–P9
```
