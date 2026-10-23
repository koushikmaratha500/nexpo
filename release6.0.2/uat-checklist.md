# Release 6.0.2 — UAT checklist

## Prerequisites

- [ ] Migration applied (`MonthlyDigestDelivery`, `monthlyDigestEnabled`)
- [ ] `ENABLE_RESEND=true`, verified `RESEND_FROM_EMAIL`
- [ ] Follow [`trigger-setup.md`](./trigger-setup.md) — prod env vars on Trigger (scheduler flag **off** until go-live)
- [ ] `npm run trigger:deploy` — `monthly-digest-dispatch` visible in Trigger.dev dashboard

## Digest logic

- [ ] `POST /api/internal/monthly-digest` with `mode: preview` returns eligible count
- [ ] `POST .../preview` with a real `userId` returns HTML
- [ ] `mode: test` delivers to `MONTHLY_DIGEST_TEST_RECIPIENT` only
- [ ] User with digest disabled in Settings does not receive production send
- [ ] Re-running production for same period does not duplicate emails (idempotency)

## Trigger

- [ ] Manual run of `monthly-digest-dispatch` in Trigger.dev DEV succeeds (or blocked with clear error if over limit)
- [ ] Production schedule shows `0 9 1 * *` Asia/Calcutta
