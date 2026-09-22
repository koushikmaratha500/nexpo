# Bot API Inventory — Nexpo services the WhatsApp bot will use

> **Audience:** Bot / Tines / OpenWA integration developers.  
> **Principle:** Bot calls **services** via a future **Command API** — not Prisma directly, not user JWT cookies.

---

## Architecture (target)

```text
WhatsApp → OpenWA → Tines → POST /api/internal/bot/command → Services → Prisma
```

Today's customer REST APIs (`/api/user/*`) require a **user session JWT**. The bot will use a **service-authenticated Command API** that accepts `userId` after `ChannelAccount` linking.

---

## 1. Transactions (personal — bot MVP)

**Service:** `TransactionService` (`lib/api/services/transaction.service.ts`)

| Bot command | Service method | Transaction type |
|-------------|----------------|------------------|
| `CREATE_EXPENSE` | `createTransaction` | `DEBIT`, `groupId: null` |
| `CREATE_INCOME` | `createTransaction` | `CREDIT` |
| `UPDATE_TRANSACTION` | `updateTransaction` | |
| `DELETE_TRANSACTION` | `deleteTransaction` | |
| `GET_TRANSACTIONS` | `getTransactions` | filter personal only |

**Existing HTTP (web/mobile today):**

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/user/transactions` | List with filters, pagination |
| POST | `/api/user/transaction` | Create single |
| GET | `/api/user/transaction/[id]` | Detail |
| PATCH | `/api/user/transaction/[id]` | Update |
| DELETE | `/api/user/transaction/[id]` | Delete |

**Key fields for bot:**

| Field | Description |
|-------|-------------|
| `type` | `DEBIT` (expense) or `CREDIT` (income) |
| `amount` | Number |
| `transactionDate` | ISO date |
| `title` / `description` | What it was for |
| `categoryName` | Resolved via `MetaResolutionService` |
| `merchant` | Optional shop name |

**Meta resolution:** `MetaResolutionService.resolveForTransaction()` maps category name, currency, payment type IDs.

---

## 2. Reports & summaries

**Service:** `ReportService.getCustomerReport()` (`lib/api/services/report.service.ts`)

| Bot command | Maps to |
|-------------|---------|
| `GET_DAILY_SUMMARY` | Report + date range = today |
| `GET_WEEKLY_SUMMARY` | Last 7 days |
| `GET_MONTHLY_SUMMARY` | Current calendar month |
| `GET_CATEGORY_SUMMARY` | Report with `categoryId` or name filter |

**Existing HTTP:**

| Method | Path |
|--------|------|
| GET | `/api/user/reports` |

**Query params:** `startDate`, `endDate`, `type` (ALL/DEBIT/CREDIT), `categoryId`, `page`, `pageSize`

**Also useful:** `lib/ai/aggregates.ts` — `getMonthSummary`, `dateHints` (used by AI chat tools; same math bot can reuse).

**Dashboard aggregates:**

| Method | Path |
|--------|------|
| GET | `/api/user/dashboard` |

---

## 3. Billing & plan gates

**Service:** `PlanService` (`lib/api/services/plan.service.ts`)

Every bot **write** must go through these checks (same as web API).

| Gate | Method | When |
|------|--------|------|
| Writes allowed | `assertWritesAllowed` | Any create/update/delete |
| Personal txn limit | `assertCanCreatePersonalTransactions` | New DEBIT/CREDIT |
| AI chat | `assertCanUseAi` | AI parse (Phase 8) |
| OCR | `assertCanRunOcr` | Receipt image |
| Groups | `assertCanCreateGroup`, `assertCanAddGroupMember` | Post-MVP group bot |
| Reminders | `assertCanCreateReminder` | Post-MVP |
| CSV export | `assertCanExportCsv` | Post-MVP |
| Receipt share | `assertCanShare` | Share link |

**HTTP failure:** `402` with body `{ code: 'WRITE_LOCKED' | 'LIMIT', ... }`

**Bot should translate 402 to WhatsApp message:** e.g. “Your trial ended — upgrade on the website.”

**Pricing disabled:** When admin sets `billing.pricingEnabled = false`, `getEntitlement()` returns unlimited Pro — all asserts pass.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/user/plan` | Current plan, limits, `pricingEnabled` |
| GET | `/api/public/config` | `pricingEnabled` for unauthenticated |

**Catalog:** `lib/billing/catalog.ts` — `FREEMIUM_LIMITS`, `TRIAL_DAYS`, prices.

---

## 4. Metadata (categories, payment types)

**HTTP:**

| Method | Path |
|--------|------|
| GET | `/api/user/metadata` |

Returns countries, currencies, categories, payment types — bot uses this to fuzzy-match “food” → category ID.

---

## 5. Groups (post-MVP bot)

**Services:** `GroupService`, `GroupTransactionService`, `SplitService`

| Bot command (future) | Service |
|----------------------|---------|
| `LIST_GROUPS` | `GroupService.listGroups` |
| `CREATE_GROUP` | `GroupService.createGroup` |
| `ADD_GROUP_EXPENSE` | `GroupTransactionService.createTransaction` |
| `GET_GROUP_BALANCES` | balances API / settlement |

**Existing HTTP:** `/api/user/groups/*` — see `app/api/user/groups/`

**MVP bot:** personal transactions only (`groupId: null`).

---

## 6. Identity linking (Phase 4 — not built yet)

**Planned schema:** `ChannelAccount`, `ChannelLinkToken` (`release6.0/schema-draft.prisma`)

| Field | Example |
|-------|---------|
| `channel` | `WHATSAPP` |
| `externalUserId` | `919876543210` or OpenWA chat id |
| `userId` | Nexpo user UUID |

**Flow:** WhatsApp message → lookup `ChannelAccount` → if missing, send web link → user logs in → confirm → linked.

**Events:** `user.linked`, `user.unlinked` (`release6.0/events-contract.md`)

---

## 7. Future Command API contract

**Route (planned):** `POST /api/internal/bot/command`  
**Auth:** `Authorization: Bearer <BOT_COMMAND_SECRET>`

**Example body:**

```json
{
  "command": "CREATE_EXPENSE",
  "user_id": "uuid",
  "correlation_id": "corr_whatsapp_abc",
  "idempotency_key": "whatsapp:msg_abc",
  "source_channel": "whatsapp",
  "payload": {
    "amount": 500,
    "currency": "INR",
    "category": "Food",
    "description": "Lunch",
    "transaction_date": "2026-09-16"
  }
}
```

**Idempotency:** `BotRequest` table — key = `channel + externalMessageId` (from OpenWA `X-OpenWA-Idempotency-Key`).

---

## 8. AI (Phase 8 — optional for MVP)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/ai/chat` | Conversational (user JWT today) |
| `POST /api/ai/ocr` | Receipt scan |

**Planned:** `POST /api/internal/bot/parse` — structured intent only; mutations still via Command API.

**Tools reference:** `lib/ai/tools/finance.tools.ts` — `readTransactions`, `monthlySummary`, etc.

---

## 9. What the bot should NOT use directly

| Avoid | Use instead |
|-------|-------------|
| User login JWT from WhatsApp | `ChannelAccount` + Command API |
| Prisma in Tines/OpenWA | Nexpo services |
| Direct DB writes from AI | Structured command → confirm → Command API |
| Group APIs in MVP | Personal transactions only |

---

## 10. Command → service map (MVP)

| Command | Primary service | Plan gate |
|---------|-----------------|-----------|
| `CREATE_EXPENSE` | `TransactionService.createTransaction` | `assertCanCreatePersonalTransactions` |
| `CREATE_INCOME` | `TransactionService.createTransaction` | same |
| `UPDATE_TRANSACTION` | `TransactionService.updateTransaction` | `assertWritesAllowed` |
| `DELETE_TRANSACTION` | `TransactionService.deleteTransaction` | `assertWritesAllowed` |
| `GET_TRANSACTIONS` | `TransactionService.getTransactions` | read — no write gate |
| `GET_DAILY_SUMMARY` | `ReportService` / aggregates | read |
| `GET_MONTHLY_SUMMARY` | `ReportService` / aggregates | read |
| `GET_CATEGORY_SUMMARY` | `ReportService` | read |

---

## Related docs

| Doc | Content |
|-----|---------|
| `release6.0/plan.md` | Full release plan |
| `release6.0/events-contract.md` | Event + command JSON |
| `release6.0/phase0-openwa-playbook.md` | OpenWA POC steps |
| `release6.0/schema-draft.prisma` | Bot tables |
| `AGENTS.md` | Layered architecture |
