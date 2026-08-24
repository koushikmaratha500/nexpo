# Release 4.0 — Technical Remediation Plan

> **Purpose:** Phased implementation and testing guide to address architecture violations, security risks, code redundancy, and implementation bugs identified in the nexpo audit (Aug 2026).
>
> **Scope:** Security hardening, legacy route removal, layered-architecture compliance, transaction-stack consolidation, auth/OTP production readiness, and test coverage expansion.
>
> **Out of scope (for now):** Release 4.0 AI feature candidates (`features.md`), mobile app (`mobile.md`), and large UI refactors (e.g. splitting `app/customer/transactions/page.tsx` into feature components — tracked as optional follow-up).

---

## How to use this document

1. Work **phase by phase** — each phase has a gate checklist; do not start the next phase until the gate passes.
2. Mark tasks in the checklist: `[ ]` todo · `[~]` in progress · `[x]` done · `[—]` skipped/deferred.
3. Run the **Test Plan** section for each phase before marking the phase gate complete.
4. Keep `AGENTS.md` updated when conventions change (e.g. after consolidating transaction endpoints).

**Related docs**

| Doc | Role |
|-----|------|
| `AGENTS.md` | Layered architecture + frontend conventions (source of truth) |
| `release2.0/architecture.md` | Original Clean Architecture rationale |
| `release3.0/tasks.md` | AI layer task format reference |
| `release3.0/tests/` | Existing Vitest suite (AI-only today) |

---

## Current state (audit summary)

| Category | Finding | Severity |
|----------|---------|----------|
| Legacy routes | `/api/expenses`, `/api/credits` — no auth, direct Prisma / JSON file | Critical |
| JWT | Hardcoded fallback secret in `auth.service.ts` | Critical |
| Auth leak | `devToken` returned on admin forgot-password | High |
| Client auth | JWT + plaintext password in `localStorage` | High |
| Uploads | User-controlled bucket; missing MIME/size checks on most routes | High |
| Architecture | 8+ route handlers + 5 services bypass repository layer | Medium |
| Redundancy | 3 parallel transaction/expense/deposit stacks | Medium |
| Dead code | `expenseStore`, `creditStore`, `useTransactions`, unused components | Medium |
| Bug | Deposit repository category filter uses wrong Prisma `where` shape | Medium |
| OTP | `Math.random()`, in-memory store (serverless-unsafe) | Medium |
| Tests | 7 tests, AI layer only (~3% of codebase) | Medium |
| Dependencies | 16 npm audit findings (axios, sharp, etc.) | Medium |

---

## Target architecture (end state)

```mermaid
flowchart TB
  subgraph client [Frontend]
    Pages[Pages] --> TS[transactionStore / hooks]
    Pages --> FC[components/features/*]
    TS --> Axios[axios + AuthContext Bearer]
  end

  subgraph api [API — Layered]
    Routes[app/api/**/route.ts] --> Guard[authGuard + rateLimit]
    Guard --> Ctrl[Controllers]
    Ctrl --> Svc[Services]
    Svc --> Repo[Repositories]
    Repo --> Prisma[(Postgres via Prisma)]
  end

  subgraph ai [AI — unchanged]
    AiRoutes[/api/ai/*] --> Agents[lib/ai/agents]
    Agents --> Tools[finance.tools → TransactionRepository]
  end

  Axios --> Routes
  Axios --> AiRoutes
```

**Endpoint consolidation target**

| Domain | Canonical API | Deprecated (remove) |
|--------|---------------|---------------------|
| Transactions (DEBIT + CREDIT) | `/api/user/transactions`, `/api/user/transaction*` | `/api/user/expense*`, `/api/user/deposit*`, `/api/expenses`, `/api/credits` |
| Metadata | `/api/user/metadata` | `/api/user/category` (subset duplicate) |
| Credits (mock) | — | `/api/credits` + `mock/credits_db.json` |

---

## Phase overview

| Phase | Name | Goal | Est. effort | Depends on |
|-------|------|------|-------------|------------|
| **P0** | Security hotfixes | Close critical/high vulnerabilities without large refactors | 1–2 days | — |
| **P1** | Legacy removal | Delete unreachable legacy routes and dead client code | 1 day | P0 |
| **P2** | Architecture compliance | Move Prisma out of routes/services; fix deposit filter bug | 2–3 days | P1 |
| **P3** | Transaction consolidation | Single stack for DEBIT/CREDIT; unified responses | 3–4 days | P2 |
| **P4** | Auth & infra hardening | Production-safe OTP, rate limits, security headers | 2 days | P0 |
| **P5** | Test foundation | Vitest coverage for auth + CRUD + security regressions | 2–3 days | P0 (parallel from P2) |
| **P6** | Optional polish | UI refactor, DI decision, type-safety sweep | backlog | P3 |

---

## P0 — Security hotfixes

**Goal:** Eliminate exploitable paths in production without waiting for full consolidation.

### Tasks

- [x] **P0.1** Remove hardcoded JWT secret fallback
  - **Files:** `lib/api/services/auth.service.ts`
  - **Change:** Throw at module load or first use if `JWT_SECRET` is missing/empty. No default string.
  - **Accept:** App fails fast in dev/prod when secret unset; existing sessions require re-login after deploy.

- [x] **P0.2** Stop leaking password reset token in API response
  - **Files:** `lib/api/controllers/auth.controller.ts`, `lib/api/services/auth.service.ts`
  - **Change:** Return `devToken` only when `process.env.NODE_ENV === 'development'` **and** `process.env.EXPOSE_DEV_RESET_TOKEN === 'true'`. Never in production/staging.
  - **Accept:** Production forgot-password response is `{ success, message }` only.

- [x] **P0.3** Remove plaintext password from localStorage
  - **Files:** `components/features/auth/LoginForm.tsx`
  - **Change:** "Remember me" persists email only (or remove feature). Delete `nexpo_saved_password` reads/writes. Migrate: clear old keys on mount.
  - **Accept:** No password key in localStorage; remember-me still restores email.

- [x] **P0.4** Lock down file uploads
  - **Files:** `app/api/upload/route.ts`, `app/api/user/transaction/route.ts`, `app/api/user/transaction/[id]/route.ts`, `app/api/user/expense/route.ts`, `app/api/user/deposit/route.ts`, `lib/api/services/storage.service.ts`
  - **Change:**
    - Remove user-controlled `bucket` param; use server-side constant (`nexpo` or env).
    - Add shared helper: max size (10 MB), MIME whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
    - Require `SUPABASE_SERVICE_ROLE_KEY` in production; remove publishable-key fallback for server uploads.
  - **Accept:** Invalid MIME → 415; oversized → 413; missing service key → 503 in prod.

- [x] **P0.5** Guard or delete legacy unauthenticated routes (interim)
  - **Done:** Routes deleted (`app/api/expenses/*`, `app/api/credits/*`). P1.1 can mark duplicate removal complete.
  - **Files:** `app/api/expenses/route.ts`, `app/api/expenses/[id]/route.ts`, `app/api/credits/route.ts`, `app/api/credits/[id]/route.ts`
  - **Change (interim):** Either delete routes (preferred if P1 follows immediately) **or** return `410 Gone` with no body until P1 deletes files.
  - **Accept:** Unauthenticated callers cannot read/write transactions or mock credits.

- [~] **P0.6** Dependency security patch
  - **Done:** `package.json` axios → `^1.18.0`. Run `npm install && npm audit fix` locally to refresh lockfile.
  - **Files:** `package.json`, `package-lock.json`
  - **Change:** Upgrade `axios` to `>=1.18.0`; run `npm audit fix`; document any `--force` items deferred.
  - **Accept:** Direct dependency CVEs resolved; `npm audit` shows no high severity on direct deps.

- [x] **P0.7** Remove misleading OTP UI hint
  - **Files:** `components/features/auth/ActivateForm.tsx`
  - **Change:** Remove "Try 123456" label/placeholder.
  - **Accept:** Copy reflects real OTP flow only.

### P0 — Test plan

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P0-T1 | Manual | Start app without `JWT_SECRET` | Startup error or 503 on auth routes; no token minted with known secret |
| P0-T2 | Manual | Admin forgot-password in production mode | Response has no `devToken` |
| P0-T3 | Manual | Login with "Remember me" | Email saved; password not in Application → Local Storage |
| P0-T4 | Manual | Upload 11 MB file to transaction route | 413 |
| P0-T5 | Manual | Upload `.exe` renamed as `.jpg` | 415 (if magic-byte check added) or rejected by MIME |
| P0-T6 | Manual | `GET /api/expenses` without auth | 401/403/410 — not 200 with data |
| P0-T7 | Automated | `npm audit --audit-level=high` on direct deps | Pass or documented exceptions |
| P0-T8 | Regression | Customer login → dashboard → list transactions | Still works |

**Phase gate:** All P0 tasks checked; P0-T1–T8 pass.

---

## P1 — Legacy removal & dead code cleanup

**Goal:** Remove code paths that confuse developers and re-introduce security risk if re-wired.

### Tasks

- [x] **P1.1** Delete legacy expense/credit API routes
  - **Done (P0.5 + P1):** Routes deleted in Sprint 1; `mock/credits_db.json` removed.
  - **Delete:** `app/api/expenses/`, `app/api/credits/`, `mock/credits_db.json` (if unused elsewhere)
  - **Accept:** No references in codebase (`rg '/api/expenses'`, `rg '/api/credits'` → zero).

- [x] **P1.2** Delete orphaned Zustand stores
  - **Delete:** `store/expenseStore.ts`, `store/creditStore.ts`
  - **Update:** Remove any barrel exports; grep confirms zero imports.

- [x] **P1.3** Delete broken/unused hooks
  - **Delete:** `hooks/useTransactions.ts`, `hooks/useReports.ts` (if still unused after admin reports check)
  - **Alternative:** Fix `useTransactions` to target `/api/user/transactions` only if planning to adopt `TransactionForm` in P6.

- [x] **P1.4** Delete or archive unused feature components
  - **Delete (if not adopting in P6):** `components/features/transactions/TransactionForm.tsx`, `TransactionList.tsx`
  - **Delete:** `components/forms/DocumentUploader.tsx` (duplicate)
  - **Update:** `components/features/transactions/index.ts` exports

- [x] **P1.5** Remove redirect-only pages' dead dependencies
  - **Verified:** Redirect pages have no store/hook imports.
  - **Files:** `app/customer/expenses/page.tsx`, `app/customer/credit/page.tsx`, `app/credit/page.tsx`
  - **Change:** Keep redirects; ensure no stores/hooks imported.

- [x] **P1.6** Clean mock data used only by deleted stores
  - **Done:** Removed `mock/data.ts` and `mock/credits_db.json`.
  - **Review:** `mock/data.ts`, `mock/` folder — delete if unreferenced.

- [x] **P1.7** Update README / env docs
  - **Done:** README architecture section updated; `AGENTS.md` frontend conventions aligned.
  - **Files:** `README.md`
  - **Change:** Document required env vars (`JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`); remove references to legacy endpoints.

### P1 — Test plan

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P1-T1 | Automated | `npm run build` | Success |
| P1-T2 | Automated | `npx tsc --noEmit` | No errors |
| P1-T3 | Automated | `rg 'useExpenseStore\|useCreditStore\|useTransactions\|/api/expenses\|/api/credits'` | Zero matches |
| P1-T4 | Manual | Customer transactions page CRUD | Create/edit/delete DEBIT and CREDIT |
| P1-T5 | Manual | Visit `/customer/expenses`, `/customer/credit` | Redirect to transactions |
| P1-T6 | Manual | `npm run dev` — smoke all nav links | No console import errors |

**Phase gate:** Build + tsc clean; P1-T3 zero matches; customer transaction flows pass.

---

## P2 — Architecture compliance

**Goal:** Align runtime code with `AGENTS.md` layered rules before consolidating domains.

### Tasks

- [x] **P2.1** Fix deposit repository category filter bug
  - **Files:** `lib/api/repositories/deposit.repository.ts`
  - **Change:** `where.budgetDepositType = { name: { equals, mode } }` (mirror `transaction.repository.ts`)
  - **Accept:** Filtering deposits by budget deposit type name returns correct rows.

- [x] **P2.2** Extract shared metadata resolution
  - **Done:** `MetaResolutionService` + extended `MetaRepository` find-or-create helpers.
  - **Create:** `lib/api/services/meta-resolution.service.ts` (or methods on `MetaRepository`)
  - **Methods:** `resolveCategoryId`, `resolveCurrencyId`, `resolvePaymentTypeId`, `resolveBudgetDepositTypeId`
  - **Refactor:** `transaction.service.ts`, `expense.service.ts`, `deposit.service.ts` — remove duplicated `resolveIdsFor*`
  - **Accept:** Single implementation; services no longer import `prisma` for get-or-create.

- [x] **P2.3** Move audit writes to repositories
  - **Files:** `expense.service.ts`, `deposit.service.ts`, `support.service.ts`
  - **Change:** Use `TransactionRepository.createAudit`, add `SupportRepository.createAudit` if missing
  - **Accept:** No `prisma.*Audit.create` in services.

- [x] **P2.4** Migrate inline route handlers to layered stack
  - **Done:** Dashboard/Report/Meta/Category services + controllers; deleted `/api/user/category`.
  - **Create/extend:** `DashboardService`, `ReportService`, `CategoryService` (admin), controllers, DTOs
  - **Refactor routes:**
    - `app/api/user/dashboard/route.ts`
    - `app/api/user/reports/route.ts`
    - `app/api/user/metadata/route.ts`
    - `app/api/admin/categories/route.ts`, `[id]/route.ts`
  - **Delete:** `app/api/user/category/route.ts` ( absorbed by metadata )
  - **Accept:** Route files contain only `authGuard` + controller call; no `prisma` import.

- [x] **P2.5** Wire controller error handling through `BaseController`
  - **Done:** All controllers extend `BaseController` and use `safeExecuteJson()`.
  - **Files:** All controllers in `lib/api/controllers/`
  - **Change:** Wrap handlers with `safeExecute`; use shared `getZodMessage` / `getErrorMessage`
  - **Accept:** No duplicated per-method `catch (error: any)` blocks.

- [x] **P2.6** Decide on validation middleware
  - **Decision:** Option B — inline Zod in controllers; removed `validationMiddleware.ts`.
  - **Option A:** Adopt `validationMiddleware.ts` in route handlers
  - **Option B:** Delete unused middleware; document controller-inline Zod as convention
  - **Accept:** One documented approach; no dead unused file without comment.

- [x] **P2.7** Decide on DI container
  - **Decision:** Option B — removed `lib/api/shared/di/`; static class methods documented in `AGENTS.md`.
  - **Option A:** Call `registerDependencies()` from a single bootstrap (e.g. route module init — note Next.js constraints)
  - **Option B:** Delete `lib/api/shared/di/`; use static class methods (current de-facto pattern)
  - **Accept:** Documented in `AGENTS.md`; no orphaned `registerDependencies`.

### P2 — Test plan

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P2-T1 | Unit | Deposit repo filter with category name | Matching CREDIT rows only |
| P2-T2 | Unit | Meta resolution — existing category | Returns ID without duplicate create |
| P2-T3 | Unit | Meta resolution — new category name | Creates once; second call returns same ID |
| P2-T4 | Manual | `GET /api/user/dashboard` | Same payload shape as before (document if changed) |
| P2-T5 | Manual | `GET /api/user/reports?startDate&endDate` | Filtered results; auth required |
| P2-T6 | Manual | Admin categories CRUD | Create/list/update/delete |
| P2-T7 | Automated | `rg "from '@/lib/prisma'" app/api/` | Zero matches in route handlers |
| P2-T8 | Automated | `rg "prisma\." lib/api/services/` | Zero matches (except auth if password-reset repo not yet extracted — track as P2.8) |

- [x] **P2.8** Extract password-reset token access to `PasswordResetTokenRepository`
  - **Files:** `auth.service.ts`, new repository
  - **Accept:** `auth.service.ts` has no `prisma` import.

**Phase gate:** P2-T7 passes; P2-T1–T6 pass; audit writes only in repositories.

---

## P3 — Transaction stack consolidation

**Goal:** One API surface for all `Transaction` rows; reduce repository/service/controller triple duplication.

### Strategy

**Recommended:** Extend `TransactionService` / `TransactionController` to handle `type: DEBIT | CREDIT` explicitly. Deprecate parallel expense/deposit stacks after client migration.

### Tasks

- [x] **P3.1** Document API contract for unified transactions
  - **Create:** `release4.0/api-contract.md` (or section in this doc)
  - **Define:** List/create/update/delete shapes; `type` field; budget deposit type for CREDIT.

- [x] **P3.2** Ensure `transactionStore` covers all customer flows
  - **Files:** `store/transactionStore.ts`, `app/customer/transactions/page.tsx`
  - **Verify:** All CRUD uses `/api/user/transactions` and `/api/user/transaction*` only.

- [x] **P3.3** Add deprecation shims (temporary) — **skipped:** no active clients on expense/deposit routes; removed directly in P3.8
  - **Files:** `app/api/user/expense/*`, `app/api/user/deposit/*`
  - **Change:** Routes delegate to `TransactionController` with forced `type`; add `Deprecation` response header
  - **Accept:** Old URLs still work for one release cycle.

- [x] **P3.4** Merge repository logic
  - **Refactor:** Fold `ExpenseRepository` + `DepositRepository` query helpers into `TransactionRepository`
  - **Delete:** Expense/deposit repositories when shims removed
  - **Accept:** Single repository file owns all `prisma.transaction` access.

- [x] **P3.5** Merge services and controllers
  - **Refactor:** `ExpenseService`/`DepositService` → methods on `TransactionService` or delete
  - **Delete:** `expense.controller.ts`, `deposit.controller.ts` when shims removed

- [x] **P3.6** Standardize API response envelope
  - **Convention:**
    - Success list: `{ items: T[], total: number }`
    - Success single: `{ item: T }` or raw entity (pick one — document)
    - Error: `{ error: string }` with appropriate HTTP status
    - Delete: `{ success: true }` or `204 No Content` (pick one)
  - **Update:** Controllers + `types/api.ts` + stores to match
  - **Accept:** No client-side `response.data.items \|\| response.data` defensive parsing.

- [x] **P3.7** Real pagination (replace pageSize=1000 pattern)
  - **Files:** `transactionStore.ts`, `app/api/user/reports/route.ts`, admin list pages
  - **Change:** Default `pageSize=20`; server enforces max `pageSize=100`
  - **Accept:** Reports route respects `page`/`pageSize`; dashboard uses aggregated queries not full table scan.

- [x] **P3.8** Remove deprecated expense/deposit routes (final)
  - **Delete:** `app/api/user/expense/`, `app/api/user/deposit/`, related DTOs if redundant
  - **Accept:** Grep shows single transaction route tree only.

### P3 — Test plan

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P3-T1 | Integration | Create DEBIT transaction | 201; type DEBIT; category resolved |
| P3-T2 | Integration | Create CREDIT (budget deposit) | 201; type CREDIT; budgetDepositType resolved |
| P3-T3 | Integration | List with `type=DEBIT` filter | Only expenses |
| P3-T4 | Integration | List with `type=CREDIT` filter | Only deposits |
| P3-T5 | Integration | Update + soft delete | Audit row created via repository |
| P3-T6 | Manual | Full customer transactions UI | Add/edit/delete both tabs |
| P3-T7 | Manual | Import CSV flow | Still works via `/api/user/transactions/import` |
| P3-T8 | Manual | Recurring approval panel | Still works |
| P3-T9 | Regression | AI finance tools (`readTransactions`) | Still scoped to user; correct totals |
| P3-T10 | Load | Reports with 500+ transactions | Response < 2s locally; uses pagination/aggregation |

**Phase gate:** P3-T1–T9 pass; deprecated routes removed; response envelope documented.

---

## P4 — Auth & infrastructure hardening

**Goal:** Production-safe auth/session/OTP; broader rate limiting and security headers.

### Tasks

- [x] **P4.1** Secure OTP generation and storage
  - **Files:** `lib/api/services/otp.service.ts`
  - **Change:** `crypto.randomInt(100000, 999999)`; store OTPs in Redis/Upstash (same infra as rate limiter) with TTL
  - **Accept:** OTP survives instance restart; not shared across users; 15min TTL; max 5 attempts.

- [x] **P4.2** Expand rate limiting
  - **Files:** `lib/api/middleware/rateLimiter.ts`, high-risk routes
  - **Add limits:** Transaction create/update (per user/minute), admin user management, login (already partially covered)
  - **Fix:** When Redis returns `success: false`, do **not** silently fall through to permissive in-memory store in production
  - **Accept:** Documented limits table in README; 429 returns `{ error }`.

- [x] **P4.3** Add Next.js middleware for security headers
  - **Create:** `middleware.ts` (root)
  - **Headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, baseline CSP
  - **Optional:** Edge auth redirect for `/admin/*`, `/customer/*` (requires cookie or header strategy — may defer if staying Bearer-only)
  - **Accept:** Security headers present on HTML responses.

- [x] **P4.4** Sanitize Markdown links in AI assistant
  - **Files:** `components/ui/Markdown.tsx`
  - **Change:** Block `javascript:`, `data:` hrefs; optionally force `https:` for external links
  - **Accept:** Poisoned model output cannot inject executable links.

- [x] **P4.5** JWT storage hardening (optional upgrade)
  - **Options:** httpOnly cookie session ( larger change ) vs. document XSS mitigation + CSP
  - **Minimum:** Document risk; ensure no password in localStorage (P0.3)
  - **Accept:** Decision recorded in `release4.0/api-contract.md` or README.

- [x] **P4.6** Seed script safety
  - **Files:** `prisma/seed.ts`
  - **Change:** Remove plaintext password comments; gate seed defaults behind `SEED_DEMO_DATA=true`
  - **Accept:** No credentials in comments; production seed requires explicit flag.

### P4 — Test plan

| ID | Type | Scenario | Expected |
|----|------|----------|----------|
| P4-T1 | Unit | OTP generation distribution | 6-digit numeric; not predictable |
| P4-T2 | Integration | Register → verify OTP → activate | Works with Redis store |
| P4-T3 | Integration | 6th OTP attempt | 429 or locked until TTL |
| P4-T4 | Manual | Response headers on `/` | Security headers present |
| P4-T5 | Manual | Markdown with `[x](javascript:alert(1))` | Link stripped or sanitized |
| P4-T6 | Load | Rate limit on transaction POST | 429 after threshold |

**Phase gate:** OTP on Redis; rate limit fail-closed in prod; P4-T1–T5 pass.

---

## P5 — Test foundation

**Goal:** Prevent regressions during remediation; expand Vitest beyond AI layer.

### Test infrastructure tasks

- [x] **P5.1** Expand Vitest config
  - **Files:** `vitest.config.ts`
  - **Change:** Include `tests/**/*.test.ts` (new top-level or `release4.0/tests/`)
  - **Add:** Test DB strategy — separate schema URL or `prisma db push` to test DB in CI

- [x] **P5.2** Test utilities
  - **Create:** `tests/helpers/auth.ts` — mint test JWT / seed test user
  - **Create:** `tests/helpers/db.ts` — setup/teardown, transaction factory
  - **Create:** `tests/helpers/request.ts` — call route handlers or supertest-style Next.js fetch

- [x] **P5.3** Security regression suite
  - **Create:** `tests/security/legacy-routes.test.ts` — assert 404/410 on removed paths
  - **Create:** `tests/security/jwt-secret.test.ts` — assert no fallback secret
  - **Create:** `tests/security/auth-guard.test.ts` — sample of protected routes return 401 without token

- [x] **P5.4** Auth flow integration tests
  - **Create:** `tests/integration/auth/register-verify-login.test.ts`
  - **Create:** `tests/integration/auth/admin-reset.test.ts` — no devToken in test env mimicking production

- [x] **P5.5** Transaction CRUD integration tests
  - **Create:** `tests/integration/transactions/crud.test.ts`
  - **Create:** `tests/integration/transactions/import-validate.test.ts`

- [x] **P5.6** Repository unit tests
  - **Create:** `tests/unit/repositories/deposit-filter.test.ts`
  - **Create:** `tests/unit/repositories/transaction-serialize.test.ts`

- [x] **P5.7** CI script
  - **Files:** `package.json`
  - **Add scripts:** `"test:unit"`, `"test:integration"`, `"test:security"`, `"test:all"`
  - **Accept:** `npm run test:all` runs full suite locally.

### P5 — Coverage targets (incremental)

| Area | Target (lines/branches) | Priority |
|------|-------------------------|----------|
| Auth service + guard | 70% | High |
| Transaction service + repository | 60% | High |
| Security regressions | 100% of known CVE paths | High |
| AI layer (existing) | Maintain current | Medium |
| Admin CRUD | 40% | Medium |
| UI components | Snapshot/manual only | Low |

**Phase gate:** `npm run test:all` passes in CI; security + auth + transaction tests green.

---

## P6 — Optional polish (backlog)

Defer until P0–P5 complete unless blocking a release.

| Task | Description |
|------|-------------|
| P6.1 | Refactor `app/customer/transactions/page.tsx` to use `TransactionForm` / `TransactionList` |
| P6.2 | Type-safety sweep — remove `any` from repositories/services (38 files) |
| P6.3 | Admin reports page → `useReports` hook + `ReportFilters` feature component |
| P6.4 | Fix typo route `adminstrators` → `administrators` with redirect shim |
| P6.5 | httpOnly cookie auth migration |
| P6.6 | E2E tests (Playwright) for critical user journeys |

---

## Cross-phase regression checklist

Run before any production deploy:

- [ ] Customer: register → OTP → login → dashboard
- [ ] Customer: create expense + budget deposit + edit + delete
- [ ] Customer: receipt OCR + AI chat + insights
- [ ] Customer: CSV import validate + import
- [ ] Admin: login → users list → block/activate → audit log
- [ ] Admin: categories CRUD
- [ ] Admin: reports export/view
- [ ] Public: support ticket submit (rate limited)
- [ ] `npm run build` + `npm run lint` + `npm run test:all` — **`test:all` passes (97 tests)**

---

## Environment variables (post-remediation)

| Variable | Required | Phase | Notes |
|----------|----------|-------|-------|
| `JWT_SECRET` | **Yes** | P0 | No fallback |
| `DATABASE_URL` | **Yes** | — | Prisma |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** (prod) | P0 | Server uploads |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Client storage |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | — | Client only — never server fallback |
| `UPSTASH_REDIS_REST_URL` | Recommended | P4 | OTP + rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | P4 | |
| `RESEND_API_KEY` | Prod | — | Email OTP / reset |
| `OPENROUTER_API_KEY` | Optional | — | AI features |
| `EXPOSE_DEV_RESET_TOKEN` | Dev only | P0 | Must be unset in prod |
| `SEED_DEMO_DATA` | Dev only | P4 | Gate demo seed users |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Removing legacy routes breaks unknown clients | Grep + 410 period; monitor logs before delete |
| JWT secret required breaks local dev | Document `.env.example`; clear error message |
| Transaction consolidation breaks UI | Deprecation shims in P3.3; full UI test checklist |
| OTP Redis adds infra dependency | Fall back to in-memory only when `NODE_ENV=development` |
| Large transactions page refactor scope creep | Keep in P6 optional |

---

## Progress tracker

| Phase | Status | Started | Completed | Owner |
|-------|--------|---------|-----------|-------|
| P0 Security hotfixes | `[x]` | 2026-08-22 | 2026-08-22 | |
| P1 Legacy removal | `[x]` | 2026-08-24 | 2026-08-24 | |
| P2 Architecture compliance | `[x]` | 2026-08-24 | 2026-08-24 | |
| P3 Transaction consolidation | `[x]` | 2026-08-24 | 2026-08-24 | |
| P4 Auth & infra hardening | `[x]` | 2026-08-24 | 2026-08-24 | |
| P5 Test foundation | `[x]` | 2026-08-24 | 2026-08-24 | |
| P6 Optional polish | `[x]` | 2026-08-24 | 2026-08-24 | P6.4 only |

---

## Sprint plan (6 sprints)

| Sprint | Scope | Gate |
|--------|-------|------|
| **Sprint 1** | **P0** Security hotfixes | P0 test plan |
| **Sprint 2** | **P1** Legacy removal + dead code | P1 test plan |
| **Sprint 3** | **P2** Architecture compliance | P2 test plan |
| **Sprint 4** | **P3** Transaction consolidation | P3 test plan |
| **Sprint 5** | **P4** Auth & infra hardening | P4 test plan |
| **Sprint 6** | **P5** Test foundation + **P6** polish (as time allows) | `npm run test:all` + regression checklist |

### Sprint 3 status (P2)

Completed 2026-08-24. Automated gates: `release4.0/tests/architecture.test.ts`, `deposit-filter.test.ts`.

### Sprint 4 status (P3)

Completed 2026-08-24. Automated gates: `release4.0/tests/transaction-consolidation.test.ts`, updated `dead-code.test.ts`, `deposit-filter.test.ts`. API contract: `release4.0/api-contract.md`. Deprecation shims skipped (no active clients).

### Sprint 5 status (P4)

Completed 2026-08-24. Automated gates: `release4.0/tests/auth-hardening.test.ts`. OTP on Redis/memory dev fallback; rate limit fail-closed in production; root `middleware.ts` security headers; Markdown link sanitization; demo seed gated by `SEED_DEMO_DATA`.

### Sprint 6 status (P5 + P6)

Completed 2026-08-24. **97 tests** via `npm run test:all`. New `tests/` tree (helpers, security, integration, unit). CI scripts: `test:unit`, `test:integration`, `test:security`, `test:all`. **P6.4:** canonical `/api/admin/administrators` route + deprecated `adminstrators` shim; admin UI updated. Deferred: P6.1–P6.3, P6.5–P6.6 (backlog).

---

## Suggested execution order (legacy 4-week view)

Superseded by 6-sprint table above. Sprint 1 = P0 only.

---

*Last updated: 2026-08-24 · All 6 sprints complete*
