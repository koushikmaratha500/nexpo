# Release 6.0 — UAT Checklist

Use after Phase 13. Test on **staging** with real WhatsApp/Telegram test accounts.

## Prerequisites

- [ ] OpenWA session healthy (staging)
- [ ] grammY webhook configured (staging)
- [ ] Tines Stories deployed (STORY-01, 02, 10, 11, 20, 21)
- [ ] Core Command API + outbox dispatcher running
- [ ] Test user: Freemium trial, expired trial, Starter

## Architecture path verification

| # | Path | Expected | Pass |
|---|------|----------|------|
| 1 | WA → OpenWA → Tines → Core → DB | Transaction created | |
| 2 | TG → grammY → Tines → Core → DB | Transaction created | |
| 3 | Core → outbox → Tines (`expense.created`) | Event received < 60s | |
| 4 | Tines never writes DB directly | Only Command API mutates | |

## Account linking

| # | Step | WhatsApp | Telegram | Pass |
|---|------|----------|----------|------|
| 1 | Unlinked user message | Link URL | /start → link | |
| 2 | Complete web link | Linked | Linked | |
| 3 | Both channels → one User | Same data | Same data | |
| 4 | Unlink in settings | Bot denies access | Bot denies access | |
| 5 | Expired link token | Rejected | Rejected | |

## Financial commands

| # | Input | Expected | WA | TG |
|---|-------|----------|----|----|
| 1 | Spent 500 on lunch | Confirm → DEBIT | | |
| 2 | Received salary 120000 | Confirm → CREDIT | | |
| 3 | Cancel at confirm | No row | | |
| 4 | What did I spend today? | Summary | | |
| 5 | Food this month | Category report | | |
| 6 | Delete last | Removed after confirm | | |
| 7 | Trial expired + add | Upgrade message | | |

## Tines automation

| # | Case | Expected | Pass |
|---|------|----------|------|
| 1 | expense.created > threshold | Large-txn alert sent | |
| 2 | Scheduled daily summary | Message at configured time | |
| 3 | notification.required event | Routed to correct channel | |
| 4 | Tines Story failure | User gets graceful error | |

## Security

| # | Case | Expected | Pass |
|---|------|----------|------|
| 1 | Duplicate webhook/message | Single transaction | |
| 2 | Invalid OpenWA HMAC | Rejected | |
| 3 | Unauthenticated Command API | 401 | |
| 4 | Unlinked user financial query | No data leaked | |
| 5 | Prompt injection | Safe refusal | |
| 6 | OpenWA session down | Graceful user message | |

## Sign-off

| Role | Name | Date |
|------|------|------|
| Dev | | |
| QA | | |
| Product | | |
