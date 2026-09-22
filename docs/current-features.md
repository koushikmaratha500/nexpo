# Nexpo (PaySaSuchan) — Current Features Inventory

> **Last updated:** September 2026  
> **Scope:** Customer (web + mobile) and Admin (web-only) features implemented in the codebase.  
> **Sources:** `app/customer/`, `app/admin/`, `app/api/user/`, `app/api/admin/`, `components/features/`, `mobile/app/`, billing libs, release docs.  
> **Non-technical version:** See [`product-guide.md`](./product-guide.md) for plain-language explanations and flow diagrams.

---

## Table of contents

- [Customer features](#customer-features)
- [Admin features](#admin-features)
- [Cross-cutting platform features](#cross-cutting-platform-features)
- [Mobile parity matrix](#mobile-parity-matrix)
- [Plan tiers & limits](#plan-tiers--limits)

---

## Customer features

### 1. Authentication & account

**What it does:** Registration, email OTP verification, login, password recovery, Google OAuth, forced reset, and session management.

| Surface | Routes / pages | Key API endpoints | Mobile |
|---------|----------------|-------------------|--------|
| Web auth | `/auth/register`, `/auth/activate`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/forced-reset`, `/auth/blocked`, `/auth/callback` | `POST /api/user/auth/register`, `verify`, `resend-otp`, `login`, `forgot-password`, `reset-password`, `forced-reset`, `google`; `GET/PATCH /api/user/auth/profile`; `POST /api/user/logout` | **Partial** — login only |
| Google OAuth | Web + mobile | `POST /api/user/auth/google`, `GET /api/auth/google` | **Yes** (when Supabase configured) |

**Notes:**
- OTP via Resend when `ENABLE_RESEND=true`
- Username (`^[a-z0-9_]{3,30}$`) required for registration; used for group invites
- Blocked users land on `/auth/blocked`

**Components:** `components/features/auth/*`

---

### 2. Dashboard

**What it does:** Month-scoped personal ledger overview — spend/income metrics, daily chart, recent transactions, AI insights, upcoming reminders.

| Surface | Route | Key API | Mobile |
|---------|-------|---------|--------|
| Web | `/customer` | `GET /api/user/dashboard`, `GET /api/user/transactions` | **Yes** |

**Widgets:** `DashboardMetrics`, `RecentTransactions`, `InsightCard`, `UpcomingReminders`

---

### 3. Personal transactions (unified DEBIT/CREDIT ledger)

**What it does:** Full personal expense/income ledger — create, edit, delete, filter, paginate; attach documents; AI receipt scan; recurring bills; CSV bulk import; share public receipt links; convert to group expense.

| Surface | Route | Key API | Mobile |
|---------|-------|---------|--------|
| Web | `/customer/transactions` | `GET/POST /api/user/transactions`, `POST /api/user/transaction`, `GET/PATCH/DELETE /api/user/transaction/[id]`, share/convert/import endpoints | **Partial** |

| Feature | Web | Mobile |
|---------|-----|--------|
| CRUD (DEBIT/CREDIT) | Yes | Yes |
| Document attach (PDF/image) | Yes | Yes |
| AI OCR auto-fill | Yes | **No** |
| CSV import | Yes | **No** |
| Recurring + approval panel | Yes | Yes |
| Share receipt link | Yes | Yes |
| Convert personal → group | Yes | **No** |
| Convert group → personal | Yes | Yes |

**Components:** `components/features/transactions/*`

**File upload:** `POST /api/upload` (Supabase storage)

---

### 4. Groups & expense splitting

**What it does:** Create/join groups; invite by username, email, or phone; role-based ACL (ADMIN/MEMBER); shared transactions with split engine; balance summary; settlement CSV; group reminders; receipt sharing.

| Surface | Routes | Key API | Mobile |
|---------|--------|---------|--------|
| Web | `/customer/groups`, `/customer/groups/[id]` | `GET/POST /api/user/groups`, members, transactions, balances, settlements, reminders | **Yes** (core) |

**Split modes:** `EQUAL_INCLUDED`, `CUSTOM_AMOUNT`, `CUSTOM_PERCENT`, `EXCLUDE`

**Group detail tabs (web):** Members · Transactions · Balances · Reminders

**Limits:** Freemium — 2 groups, 8 members each; paid — 50 members per group

**Components:** `components/features/groups/*`, `GroupRemindersPanel`

---

### 5. Payment reminders

**What it does:** Personal and group payment reminders with recurrence, channels, snooze, and completion.

| Surface | Routes | Key API | Mobile |
|---------|--------|---------|--------|
| Web | `/customer/reminders`; group tab on group detail | `GET/POST/PATCH/DELETE /api/user/reminders`, `GET /api/user/reminders/upcoming`, group reminder endpoints | **Yes** |

**Recurrence:** `NONE`, `WEEKLY`, `MONTHLY`  
**Channels:** `IN_APP`, `EMAIL`, `PUSH` (WhatsApp in schema, not dispatched)  
**Freemium limit:** 10 active reminders

**Components:** `PersonalRemindersPanel`, `GroupRemindersPanel`

---

### 6. Notifications

**What it does:** In-app notification inbox, unread badge, read/mark-all, push subscription (web OneSignal), user preference toggles governed by admin global policy.

| Surface | Routes | Key API | Mobile |
|---------|--------|---------|--------|
| Web | Bell in shell; `/customer/notifications` | `GET /api/user/notifications`, read endpoints, preferences, push register | **Partial** |

**Mobile:** Inbox + preference toggles; **no native push SDK** (future EAS push)

**Components:** `NotificationBell`, `NotificationPreferencesCard`, `OneSignalProvider`

---

### 7. Reports

**What it does:** Filtered personal transaction reports with category breakdown and CSV export.

| Surface | Route | Key API | Mobile |
|---------|-------|---------|--------|
| Web | `/customer/reports` | `GET /api/user/reports` | **Yes** |

**Filters:** date range, category, type (ALL/DEBIT/CREDIT), search, pagination  
**Export:** Client-side CSV on web; native Share on mobile

**Components:** `ReportFilters`

---

### 8. AI assistant (Finlit)

**What it does:** Conversational finance copilot and proactive dashboard insights (Vercel AI SDK + OpenRouter).

| Surface | Routes | Key API | Mobile |
|---------|--------|---------|--------|
| Web | `/customer/assistant`; insights on dashboard | `POST /api/ai/chat`, `GET /api/ai/insights`, `POST /api/ai/ocr` | **Yes** (chat) |

**Chat tools:** `readTransactions`, `monthlySummary`, `forecastCashflow`, `getSavingsOpportunities`  
**Limits:** Freemium 15 AI messages; rate limits on chat/insights  
**Gated by:** `PlanService.assertCanUseAi` / `assertCanRunOcr`

**Components:** `AiAssistant`, `InsightCard`

---

### 9. Billing & plans

**What it does:** Freemium trial, Starter subscription, Pro lifetime purchase, usage meters, upgrade wall, GST invoices, subscription cancel. Admin can disable pricing module entirely.

| Surface | Routes | Key API | Mobile |
|---------|--------|---------|--------|
| Web | `/pricing`, landing `#pricing`, Settings billing section | `GET /api/user/plan`, billing checkout/verify/cancel/invoices | **Partial** |

**Mobile gaps:** Razorpay → web only; no invoice PDF; Stripe opens browser

**Admin pricing toggle:** `billing.pricingEnabled` — when off, all users get full Pro access and pricing UI is hidden

**Components:** `PlanProvider`, `PlanBanner`, `UpgradeWall`, `BillingSubscription`, `BillingInvoices`, `UsageMeters`

See [Plan tiers & limits](#plan-tiers--limits) below.

---

### 10. Settings & profile

**What it does:** Profile editing, avatar upload, country/currency, password change, notification preferences, billing management.

| Surface | Route | Key API | Mobile |
|---------|-------|---------|--------|
| Web | `/customer/settings` | `GET/PATCH /api/user/auth/profile`, `GET /api/user/metadata`, `POST /api/upload` | **Yes** |

---

### 11. Support / help center

**What it does:** FAQ categories and support ticket submission (with file attachment).

| Surface | Route | Key API | Mobile |
|---------|-------|---------|--------|
| Web | `/customer/support` | `POST /api/support` | **Yes** |

**Components:** `components/features/support/*`

---

### 12. Receipt sharing (public)

**What it does:** Time-limited public receipt links with OG image for social sharing.

| Surface | Routes | Key API | Mobile |
|---------|--------|---------|--------|
| Web | `/r/[token]` | `GET /api/public/receipts/[token]`, `GET /api/og/receipt/[token]` | **Yes** (Share sheet) |

**Components:** `PublicReceiptView`, `ShareReceiptButton`, `ShareReceiptMenu`

---

### 13. Marketing / public web

| Route | Purpose |
|-------|---------|
| `/` | Landing page (features, pricing if enabled, partners, CTA) |
| `/pricing` | Standalone pricing (redirects home if `pricingEnabled=false`) |

---

### Customer navigation summary

**Web sidebar:** Dashboard · Transactions · Groups · Reminders · Reports · AI Assistant · Settings + Help Center + Notifications bell + FAB “Add Transaction”

**Mobile tabs:** Dashboard · Transactions · Groups · Reminders · Reports · AI Assistant · Settings + stack: notifications, support, group detail

---

## Admin features

> Admin is **web-only** — no mobile admin console.

### 1. Authentication

| Routes | Key API |
|--------|---------|
| `/admin/login`, `/admin/forgot-password`, `/admin/reset-password` | `POST /api/admin/auth/login`, `forgot-password`, `reset-password`, `PATCH profile`, `POST logout` |

---

### 2. Dashboard

**What it does:** Platform-wide metrics — user count, expense volume, budget volume, monthly ledger flow chart, spend by country, open support tickets.

| Route | Key API |
|-------|---------|
| `/admin` | `GET /api/admin/dashboard`, `GET /api/admin/reports` |

---

### 3. Customer management

**What it does:** List, search, paginate customers; view/edit/block/activate; forced password reset; manual plan grants; view transactions, audit logs, invoices.

| Routes | Key API |
|--------|---------|
| `/admin/users`, `/admin/users/[id]` | `GET/POST /api/admin/users`, `GET/PATCH/DELETE /api/admin/user/[id]`, overview, expenses, auditlogs, invoices, activate, block, reset-password, plan |

**User detail tabs:** Overview · Transactions · Audit logs · Billing/invoices · Plan management

---

### 4. Groups (read-only oversight)

**What it does:** List all platform groups; view members and balance aggregates (no transaction editing).

| Routes | Key API |
|--------|---------|
| `/admin/groups`, `/admin/groups/[id]` | `GET /api/admin/groups`, `GET .../[id]`, `GET .../balances` |

**Components:** `AdminGroupList`

---

### 5. Reminders (platform-wide)

**What it does:** View all personal and group reminders; filter by scope/status; inspect detail.

| Route | Key API |
|-------|---------|
| `/admin/reminders` | `GET /api/admin/reminders`, `GET /api/admin/reminders/[id]` |

**Components:** `AdminReminderList`, `AdminReminderDetailModal`

---

### 6. Administrators

**What it does:** CRUD admin accounts, view sessions, audit logs, overview stats.

| Route | Key API |
|-------|---------|
| `/admin/admins` | `GET/POST /api/admin/administrators`, `PATCH/DELETE /api/admin/administrator/[id]`, overview, auditlogs |

---

### 7. Categories

**What it does:** Manage expense/income categories (DEBIT/CREDIT types, color, icon, status).

| Route | Key API |
|-------|---------|
| `/admin/categories` | `GET/POST /api/admin/categories`, `GET/PATCH/DELETE /api/admin/categories/[id]` |

---

### 8. Billing & revenue

**What it does:** Revenue overview, MRR estimate, plan mix, plan status counts, recent payments table.

| Route | Key API |
|-------|---------|
| `/admin/billing` | `GET /api/admin/billing/overview` |

---

### 9. Reports

**What it does:** Cross-user expense report with date filters, category breakdown, aggregates.

| Route | Key API |
|-------|---------|
| `/admin/reports` | `GET /api/admin/reports` |

---

### 10. Support triage

**What it does:** List support tickets, filter by status, view detail, update status/notes, soft-delete.

| Routes | Key API |
|--------|---------|
| `/admin/support`, `/admin/support/[id]` | `GET /api/admin/support`, `GET/PATCH/DELETE /api/admin/support/[id]` |

**Components:** `SupportTicketList`, `SupportTicketDetail`, `SupportStatusBadge`

---

### 11. System settings

**What it does:** Persist platform configuration and notification/billing policy.

| Route | Key API |
|-------|---------|
| `/admin/settings` | `GET/PATCH /api/admin/settings` |

| Group | Settings |
|-------|----------|
| Ledger policy | `baseCurrency`, `matchingRate`, `requireReceipt`, `autoApproveLimit` |
| Notification policy | `pushEnabled`, `emailRemindersEnabled`, `inAppEnabled`, `defaultChannels` |
| Billing | `checkoutProvider` (razorpay/stripe), **`pricingEnabled`** toggle |
| Infra status | `resendEnabled`, `razorpayConfigured`, `stripeConfigured` (read-only) |

---

### Admin navigation summary

Dashboard · Customers · Groups · Reminders · Administrators · Categories · Billing · Reports · Support · Settings

---

## Cross-cutting platform features

### Billing & payments (Release 5.0)

| Area | Implementation |
|------|----------------|
| Plans | FREEMIUM → STARTER (monthly/yearly) → PRO (lifetime) |
| Gate | `PlanService` — write locks, feature flags, usage limits; HTTP 402 |
| Checkout | Razorpay (in-app modal) or Stripe (redirect) |
| Invoices | GST PDF generation, email via Resend |
| Admin override | Manual plan grant per user |
| Pricing kill-switch | `pricingEnabled=false` → unlimited Pro for all |
| Lifecycle | Trigger.dev `billing-lifecycle-dispatch` |
| Webhooks | `/api/billing/webhooks/razorpay`, `/api/billing/webhooks/stripe` |

### Groups & splits (Release 4.1)

- Shared `Transaction` table with optional `groupId`
- Personal APIs filter `groupId IS NULL`
- `SplitService.calculate()` — equal/custom amount/custom percent splits
- Settlement export CSV (who owes whom)
- ACL in `GroupService` / `GroupTransactionService`

### AI layer (Release 3.0+)

| Endpoint | Purpose |
|----------|---------|
| `/api/ai/ocr` | Receipt image → structured extraction |
| `/api/ai/chat` | Streaming copilot with finance tools |
| `/api/ai/insights` | Proactive dashboard insights (cached) |
| `/api/ai/health` | AI availability check |

Config: `OPENROUTER_API_KEY`, `AI_ENABLED`, model overrides in `lib/ai/config.ts`

### Notifications & reminders (Release 4.1)

| Channel | Provider |
|---------|----------|
| In-app | DB `InAppNotification` |
| Email | Resend |
| Push (web) | OneSignal |
| WhatsApp | Schema only; not implemented |

**Effective delivery** = admin global policy AND user preference AND channel rules.

### Background jobs (Trigger.dev)

| Task | Schedule (IST) | Purpose |
|------|----------------|---------|
| `reminder-due-dispatch` | 07:00 | Reminder dispatch |
| `billing-lifecycle-dispatch` | 08:00 | Subscription lifecycle |
| `purge-expired-receipt-shares` | 02:30 | Clean expired receipt tokens |
| `daily-health-check` | 06:00 | Platform health |

Manual fallback: `POST /api/internal/reminders/dispatch`, `POST /api/internal/billing/dispatch`

### Public APIs

| Endpoint | Purpose |
|----------|---------|
| `GET /api/public/config` | `{ pricingEnabled }` for landing/mobile |
| `GET /api/public/receipts/[token]` | Public receipt data |
| `POST /api/support` | Support ticket creation |
| `GET /api/health` | Health check |

### File storage

- `POST /api/upload` → Supabase storage (avatars, receipts, support attachments)

---

## Mobile parity matrix

| Feature area | Parity |
|--------------|--------|
| Auth (login, Google) | **Partial** (no register/OTP/forgot) |
| Dashboard | **Yes** |
| Personal transactions CRUD | **Yes** |
| Recurring approval | **Yes** |
| AI OCR | **No** |
| CSV import | **No** |
| Receipt share | **Yes** |
| Convert transaction | **Partial** (group→personal only) |
| Groups + splits | **Yes** |
| Group settlement export | **No** |
| Reminders (personal + group) | **Yes** |
| Notification inbox | **Yes** |
| Push notifications | **No** |
| Reports + export | **Yes** (Share-based) |
| AI chat | **Yes** |
| Billing | **Partial** (Razorpay web-only; no invoice PDF) |
| Support | **Yes** |
| Admin console | **No** |

---

## Plan tiers & limits

| Plan | Price (INR, ex-GST) | Billing | Entitlements |
|------|---------------------|---------|--------------|
| **Freemium** | ₹0 | 7-day trial | Limited usage; writes lock after trial |
| **Starter** | ₹100/mo or ₹1,000/yr | Recurring | Unlimited transactions, groups, OCR, AI, CSV, reminders |
| **Pro** | ₹10,000 one-time | Lifetime | Same as Starter + lifetime access |

### Freemium limits

| Resource | Limit |
|----------|-------|
| Personal transactions | 50 |
| Receipt scans (OCR) | 10 |
| Groups | 2 |
| Members per group | 8 |
| Active reminders | 10 |
| AI messages | 15 |

### When `pricingEnabled = false` (admin toggle)

All users receive full Pro access regardless of stored plan. Pricing UI hidden on web and mobile.

---

## Component index (`components/features/`)

| Folder | Purpose |
|--------|---------|
| `auth/` | Login, register, OTP, password flows |
| `billing/` | Plan banner, upgrade wall, invoices, usage meters |
| `dashboard/` | Metrics, recent transactions |
| `transactions/` | Upload, import, recurring, convert, detail |
| `groups/` | List, create, members, transactions, balances, splits |
| `reminders/` | Personal + group reminder panels |
| `notifications/` | Bell, preferences, OneSignal |
| `reports/` | Report filters |
| `assistant/` | AI chat + insight card |
| `share/` | Public receipt view, share buttons |
| `support/` | Ticket list/detail |
| `users/` | `UserProfileLink` |
| `admin/groups/` | Admin group list |
| `admin/reminders/` | Admin reminder list + detail |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| `AGENTS.md` | Architecture conventions |
| `release5.0/billing-go-live-checklist.md` | Billing go-live |
| `release6.0/plan.md` | WhatsApp/Telegram bot roadmap (not yet shipped) |
| `mobile/README.md` | Mobile setup and parity notes |
