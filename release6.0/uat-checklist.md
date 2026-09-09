# Release 6.0 — UAT Checklist

Use after Phase 11. Test on **staging** with real WhatsApp/Telegram test accounts.

## Prerequisites

- [ ] OpenWA session healthy (staging)
- [ ] Telegram webhook configured (staging)
- [ ] Test user on Freemium trial
- [ ] Test user on expired trial (write lock)
- [ ] Test user on Starter plan

## Account linking

| # | Step | WhatsApp | Telegram | Pass |
|---|------|----------|----------|------|
| 1 | Unlinked user sends message | Link URL returned | /start → link button | |
| 2 | Complete web link flow | Account linked | Account linked | |
| 3 | Same user links second channel | Both map to one User | Both map to one User | |
| 4 | Unlink from settings | Bot denies financial access | Bot denies financial access | |
| 5 | Expired link token | Cannot reuse | Cannot reuse | |

## Expenses & income

| # | Input | Expected | WA | TG |
|---|-------|----------|----|----|
| 1 | Spent 500 on lunch | Confirm → DEBIT created | | |
| 2 | Received salary 120000 | Confirm → CREDIT created | | |
| 3 | Cancel at confirm | No row created | | |
| 4 | Edit last to 900 | Updated amount | | |
| 5 | Delete last | Removed after confirm | | |

## Queries

| # | Input | Expected | WA | TG |
|---|-------|----------|----|----|
| 1 | What did I spend today? | Today total | | |
| 2 | This month | Month summary | | |
| 3 | Food this month | Category breakdown | | |
| 4 | Last 5 expenses | List returned | | |

## Security & reliability

| # | Case | Expected | Pass |
|---|------|----------|------|
| 1 | Duplicate webhook payload | Single transaction | |
| 2 | Invalid OpenWA HMAC | 401, no processing | |
| 3 | Unlinked user query | No financial data | |
| 4 | Trial expired + add expense | Upgrade message (402) | |
| 5 | Prompt injection ("delete all") | Refusal, no mutation | |
| 6 | OpenWA down | Graceful user message | |

## Sign-off

| Role | Name | Date |
|------|------|------|
| Dev | | |
| QA | | |
| Product | | |
