# Nexpo API Contract (Release 4.0)

Unified transaction API surface. Expense (`DEBIT`) and deposit (`CREDIT`) legacy routes were removed in Sprint 4 (P3).

## Response envelope

| Operation | Shape | HTTP |
|-----------|--------|------|
| List | `{ items: T[], total: number }` | 200 |
| Single entity | Raw serialized entity | 200 / 201 |
| Delete | `{ success: true, message?: string }` | 200 |
| Error | `{ error: string }` | 4xx / 5xx |

Amounts in list responses are serialized as numbers (not Prisma `Decimal` objects).

## Pagination

Query params: `page` (default `1`), `pageSize` (default `20`, max `100`).

Clients that need full datasets (e.g. client-side search) should page through results with `pageSize=100` until `items.length >= total`.

---

## User transactions

### List

`GET /api/user/transactions`

| Param | Type | Notes |
|-------|------|-------|
| `type` | `DEBIT` \| `CREDIT` | Optional filter |
| `categoryId` | string | Expense category id |
| `category` | string | Budget deposit type name (CREDIT) |
| `startDate` | ISO date string | Inclusive |
| `endDate` | ISO date string | Inclusive |
| `page` | number | Default 1 |
| `pageSize` | number | Default 20, max 100 |

**Response:** `{ items: Transaction[], total: number }`

### Create

`POST /api/user/transaction` — `multipart/form-data` or JSON

Required fields depend on `type`:

- **DEBIT:** `type`, `amount`, `transactionDate`, category via `category` or `categoryId`
- **CREDIT:** `type`, `amount`, `transactionDate`, deposit type via `category` / `budgetDepositType`

Optional: `title`, `merchant`, `notes`, `currency`, `paymentType`, `isRecurring`, `recurringDay`, `file`

**Response:** Created transaction entity (201).

### Read / update / delete

- `GET /api/user/transaction/[id]`
- `PATCH /api/user/transaction/[id]`
- `DELETE /api/user/transaction/[id]` — soft delete (`status: D`)

### Recurring

- `GET /api/user/transactions/recurring` → `{ items: PendingRecurring[] }`
- `POST /api/user/transactions/recurring` → `{ approved, skipped, transactions? }`

### Import

`POST /api/user/transactions/import` — CSV batch import

---

## User reports

`GET /api/user/reports`

| Param | Type | Default |
|-------|------|---------|
| `type` | `DEBIT` \| `CREDIT` \| `ALL` | `DEBIT` |
| `categoryId` | string | — |
| `startDate` | string | — |
| `endDate` | string | — |
| `page` | number | 1 |
| `pageSize` | number | 20 (max 100) |

**Response:**

```json
{
  "expenses": Transaction[],
  "total": number,
  "categoryBreakdown": [{ "categoryId": null, "categoryName": string, "totalAmount": number, "count": number }],
  "totalAmount": number
}
```

`categoryBreakdown` and `totalAmount` reflect the full filtered set; `expenses` is paginated.

---

## Admin user transactions

`GET /api/admin/user/[id]/expenses` — returns `{ items, total }` for `type=DEBIT` only (route name retained for admin UI).

Auth: `ADMIN` Bearer token.

---

## Removed (P3)

Do not use:

- `/api/user/expense`, `/api/user/expenses`
- `/api/user/deposit`, `/api/user/deposits`

Use `/api/user/transaction*` and `/api/user/transactions` with `type=DEBIT|CREDIT` instead.

---

## Authentication & session storage (P4)

- **API auth:** Bearer JWT in `Authorization` header; sessions validated against the database (`SessionRepository`).
- **Client storage:** JWT is persisted in `localStorage` via Zustand (`nexpo_auth_store`). Passwords are never stored client-side.
- **Risk:** XSS could exfiltrate tokens from `localStorage`. Mitigations: baseline CSP (see root `middleware.ts`), no password persistence, sanitized AI markdown links.
- **Future upgrade:** httpOnly secure cookies would reduce XSS token theft; deferred due to scope — document-only decision for Release 4.0.

## OTP (P4)

- 6-digit codes from `crypto.randomInt(100000, 999999)`.
- Stored in Redis/Upstash (or Vercel KV) with **15-minute TTL**; max **5** verification attempts per code.
- Production requires Redis (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` or Vercel KV equivalents).

## Rate limiting (P4)

All limits return `{ error: string }` with HTTP **429** (or **503** when Redis is unavailable in production).

| Route group | Key | Limit | Window |
|-------------|-----|-------|--------|
| User/admin login | IP | 10 | 60s |
| Register | IP | 5 | 60s |
| OTP verify | IP | 10 | 60s |
| Transaction create/update/delete | user id | 30 | 60s |
| Admin user management | admin id | 20 | 60s |
| Support | IP | 20 | 60s |
| AI chat/OCR/insights | user id | 10–20 | 60s |

In production, rate limiting **fail-closes** when Redis is not configured or errors (no permissive in-memory fallback).
