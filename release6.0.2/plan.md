# Release 6.0.2 — Monthly Money Digest

## Summary

**Trigger.dev** task `monthly-digest-dispatch` runs on the **1st of each month at 09:00 Asia/Kolkata** and calls `MonthlyDigestDispatchService` in-process (same logic as `POST /api/internal/monthly-digest`). PaysaSuchan computes the **previous calendar month** (personal ledger + group expense shares), renders a React Email digest with an SVG pie chart, and sends via Resend with idempotency and a configurable monthly send cap.

## Acceptance checklist

- [ ] Trigger schedule deployed (`npm run trigger:deploy`) — see `trigger-monthly-digest.md`
- [ ] Period boundaries use `[start, end)` in IST
- [ ] Eligibility: active user, verified email, notification prefs, admin email policy
- [ ] Aggregation includes personal debits/credits and group `computedAmount` shares
- [ ] Idempotency: `MonthlyDigestDelivery` unique `(userId, period)`
- [ ] Production blocked when eligible users exceed `MONTHLY_DIGEST_EMAIL_LIMIT`
- [ ] Batch sends up to 100 per Resend batch call
- [ ] Preview and test modes for safe QA

## Env vars

See `env.md`.
