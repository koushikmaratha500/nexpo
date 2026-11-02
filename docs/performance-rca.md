# Performance RCA (Nexpo web + mobile)

## Symptoms

- Customers report sluggish dashboards and transaction screens, especially on mobile.
- Admin dashboard felt heavy when loading chart data alongside large report fetches (addressed in Release 6 dashboard work).

## Root causes identified

### 1. Mobile home screen fetched the entire transaction history

**Before:** `mobile/app/(app)/(tabs)/index.tsx` used `transactionStore.fetchTransactions()`, which paginates at 100 rows and can loop up to 50 pages (~5,000 rows) to compute totals client-side.

**Impact:** High latency, memory use, and battery drain on every dashboard visit.

**Fix:** Home screen now calls a single `GET /api/user/dashboard` (Redis-backed cache on server, same as web). Reminders still use `GET /api/user/reminders/upcoming` (small payload).

### 2. Uncached customer metadata on every form open

**Before:** `GET /api/user/metadata` hit Postgres on every request (categories, payment types, currencies, etc.).

**Fix:** `MetaService.getCustomerMetadata()` caches JSON in Redis (`nexpo:metadata:v1:customer`, TTL 300s). Invalidation is time-based; acceptable for reference data that changes rarely.

### 3. Dashboard aggregation repeated on every request

**Mitigation (existing):** `DashboardCacheService` stores per-user dashboard payloads until midnight in app timezone (`Asia/Kolkata`), invalidated on personal transaction writes.

**Recommendation:** Ensure Vercel KV (`KV_REST_API_URL` / `KV_REST_API_TOKEN`) or Upstash (`UPSTASH_REDIS_REST_*`) is set in production so cache, metadata, OTP, and optional presence use Redis rather than in-memory fallback (dev only).

### 4. Transaction list “include totals” without indexes

**Risk:** Day/month/YTD totals add aggregate queries on list endpoints when `includeTotals=true`.

**Mitigation:** Use period-scoped queries and indexes on `(userId, groupId, transactionDate)`; prefer cached dashboard for summary cards instead of re-fetching all rows on mobile.

### 5. Optional admin chart/report fan-out

**Mitigation:** Admin dashboard metrics use cached aggregates and `findRecentGlobalLedger(5)` instead of loading 1k report rows for recent activity.

## Presence feature (experimental)

- **Not a performance regression when off:** `ENABLE_PRESENCE` defaults off. No DB writes; Redis TTL keys only.
- **When on:** Clients POST heartbeat every ~60s; admin polls every 30s on user detail. Keep Redis colocated with app region to minimize latency.

## Verification checklist

- [ ] Mobile dashboard: one dashboard API call in network tab (not multi-page `/transactions`).
- [ ] Second metadata request within 5 minutes should be fast (cache hit if Redis configured).
- [ ] Personal transaction create/edit still loads dropdowns from `/api/user/metadata`.
- [ ] Load test: p95 dashboard & list endpoints with Redis enabled vs disabled.

## Env vars related to performance

| Variable | Purpose |
|----------|---------|
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel KV — dashboard cache, metadata, OTP, presence |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash alternative (same client layer) |
| `ENABLE_PRESENCE` | Opt-in online status (default off) |
