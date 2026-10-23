# Flutter (Paysasuchan) — Customer Dashboard API Handoff

Use this document when wiring the **Home / Dashboard** screen to the Nexpo backend after the performance update deployed on the web app. The legacy Expo app under `nexpo/mobile` still uses the old pattern; **do not copy that** — follow this spec instead.

---

## Summary of the change

| Before (slow) | After (recommended) |
|---------------|---------------------|
| Paginate `GET /api/user/transactions` until all rows are loaded (100/page, up to 50 pages) | Single `GET /api/user/dashboard` for the **current calendar month** |
| Client filters by month, computes totals, chart, categories | Server returns precomputed metrics + chart series + top categories + recent rows |
| Includes group + personal rows if not filtered | **Personal ledger only** (`groupId IS NULL`), matching web |

**Keep unchanged on dashboard load (parallel):**

- `GET /api/user/reminders/upcoming` — reminders due in the next 7 days (optional UI block).

**Still use paginated transactions elsewhere:**

- Full activity / transaction list screens → `GET /api/user/transactions?page=&pageSize=` (with optional `startDate` / `endDate` filters).

---

## Endpoint

```
GET {baseUrl}/api/user/dashboard
GET {baseUrl}/api/user/dashboard?month=2026-10
```

### Authentication

```
Authorization: Bearer <customer_jwt>
```

Same token as other customer APIs. Session must be active server-side (invalid/expired → `401`).

### Query parameters

| Name | Required | Description |
|------|----------|-------------|
| `month` | No | `YYYY-MM`. Defaults to **current month** in server local calendar logic. Invalid format → `400` with `{ "error": "..." }`. |

### Success response (`200`)

JSON body (no `{ success, data }` wrapper — raw payload):

```json
{
  "month": "2026-10",
  "totalSpend": 12500.5,
  "todaySpend": 450,
  "totalDeposits": 80000,
  "chart": {
    "labels": ["1", "2", "3"],
    "income": [0, 80000, 0],
    "expenses": [120, 0, 330]
  },
  "categoryBreakdown": [
    { "name": "FOOD", "percentage": 45, "color": "bg-secondary" },
    { "name": "RENT", "percentage": 30, "color": "bg-primary" }
  ],
  "recentTransactions": [
    {
      "id": "uuid",
      "type": "DEBIT",
      "title": "Coffee",
      "category": "FOOD",
      "date": "15-10-2026",
      "amount": 100,
      "currency": "INR",
      "status": "PENDING",
      "paymentType": "Credit Card",
      "submittedBy": "Alex Sterling"
    }
  ]
}
```

### Field notes for Flutter

- **`totalSpend` / `todaySpend`**: Expense-side totals using the same ledger rules as web (`DEBIT` expenses; income categories treated as credit — server applies `isLedgerExpenseTransaction` / `isLedgerIncomeTransaction`).
- **`totalDeposits`**: Income-side total for the month.
- **`chart`**: One entry per **day of month**. `labels[i]` is day number as string; `income[i]` and `expenses[i]` are amounts for that day. Use for a bar/line chart if you add one (web has a full chart; Expo mobile only showed summary cards + lists).
- **`categoryBreakdown`**: Top **3** categories by spend share. `percentage` is 0–100 integer. **`color`** is a **web Tailwind class name** — map to your Flutter theme tokens or ignore and use local palette.
- **`recentTransactions`**: Top **3** transactions in the month by date (desc). **`date`** is display format **`DD-MM-YYYY`**, not ISO — parse accordingly or show as-is.
- **`recentTransactions`**: Full client shape may include optional fields (`merchant`, `documentUrl`, `isRecurring`, etc.) — same as transaction list mapping on web.

### Error responses

Standard Nexpo customer JSON errors:

| Status | Body |
|--------|------|
| `401` | `{ "error": "Unauthorized: ..." }` |
| `403` | `{ "error": "Forbidden: ..." }` |
| `400` | `{ "error": "..." }` (validation, e.g. bad `month`) |
| `500` | `{ "error": "Failed to fetch dashboard metrics" }` (or similar) |

---

## Suggested Flutter architecture

1. **`DashboardRepository`** (or API service)
   - `Future<CustomerDashboard> fetchDashboard({String? monthYm})`
   - Builds URL with optional `month` query.
   - Attaches Bearer token from secure storage / auth bloc.

2. **`CustomerDashboard` model** (json_serializable / freezed)
   - Mirror the response types above.
   - Nested: `DashboardChart`, `CategoryBreakdownItem`, reuse existing `Transaction` / `LedgerTransaction` model for `recentTransactions` if fields align.

3. **Dashboard screen (Home tab)**
   - **On first load**: `Future.wait` or parallel calls:
     - `fetchDashboard()`
     - `fetchUpcomingReminders()` → `GET /api/user/reminders/upcoming` → `{ items: [...] }`
   - **Do not** call paginated `GET /api/user/transactions` on dashboard mount.
   - Pull-to-refresh: repeat dashboard (+ reminders) only.

4. **Transaction list screen**
   - Keep paginated `/api/user/transactions` with `page` / `pageSize` (max 100).
   - Optional: pass `startDate` / `endDate` when filtering by month in UI.

5. **Base URL**
   - Point to deployed Nexpo origin (e.g. `https://your-app.onrender.com`).
   - Same env pattern as old mobile: one config value for API origin, no trailing slash.

---

## OpenAPI / manual testing

After deploy:

- Interactive docs: `{baseUrl}/docs`
- Raw spec: `{baseUrl}/api/openapi` — search for `/api/user/dashboard` and schema `CustomerDashboard`.

---

## Backend deploy checklist (Nexpo repo)

Ensure production has:

1. Dashboard service changes (`DashboardService.getCustomerDashboard`).
2. DB index (run once): `npm run db:push` — composite index on `Transaction (userId, groupId, status, transactionDate)`.

---

## Copy-paste prompt for Flutter / Cursor / Copilot

Paste the block below into the Paysasuchan Flutter repo with your paths filled in.

```
Context: Nexpo backend now exposes an optimized customer dashboard API. Replace the Home/Dashboard screen data loading that paginates through all transactions.

Requirements:
1. On dashboard load, call GET /api/user/dashboard with Authorization: Bearer <token>. Optional query month=YYYY-MM for other months.
2. Do NOT paginate GET /api/user/transactions on dashboard entry; reserve that for the full transactions/activity screen only.
3. In parallel (optional UI), call GET /api/user/reminders/upcoming and show up to 3 items.
4. Map JSON fields: totalSpend, todaySpend, totalDeposits, chart.labels/income/expenses, categoryBreakdown (top 3), recentTransactions (top 3). Dates in recentTransactions use DD-MM-YYYY.
5. Ignore categoryBreakdown[].color Tailwind strings; use app theme colors instead.
6. Handle errors as { "error": string } with 401 → re-login flow.
7. Add pull-to-refresh on dashboard that re-fetches dashboard (+ reminders), not the full transaction store.

Reference response shape (TypeScript equivalent):
- month: string (YYYY-MM)
- totalSpend, todaySpend, totalDeposits: number
- chart: { labels: string[], income: number[], expenses: number[] }
- categoryBreakdown: { name: string, percentage: number, color: string }[]
- recentTransactions: same fields as existing ledger transaction UI model (id, type, title, category, date, amount, currency, status, ...)

Implement: repository + models + dashboard Bloc/Cubit/Provider + update Home screen widgets to bind to API state (loading/error/empty/success). Keep existing navigation to full transaction list unchanged.
```

---

## Reference implementation (web)

- API route: `app/api/user/dashboard/route.ts`
- Service: `lib/api/services/dashboard.service.ts`
- Types: `lib/api/domain/customer-dashboard.ts`
- Web UI: `app/customer/page.tsx` (uses axios `GET /api/user/dashboard`)

## Legacy reference (do not replicate)

- Expo mobile home still loads all transactions: `mobile/app/(app)/(tabs)/index.tsx` + `useTransactionStore.fetchTransactions()` — scheduled for deprecation inside Nexpo; Flutter should skip this pattern.

---

*Document version: aligned with Nexpo dashboard API as of customer dashboard performance work (month-scoped personal ledger, single-query backend).*
