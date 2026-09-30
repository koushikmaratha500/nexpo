# Release 6.1 — SMS Import UAT Checklist

## Settings & permissions

- [ ] New user: SMS import toggle defaults to **enabled**
- [ ] Disabling toggle stops background sync registration (Android)
- [ ] Re-enabling toggle re-registers background task
- [ ] Android: permission onboarding requests SMS, notifications, call, location
- [ ] iOS: settings explain auto-read is unavailable; manual import link works

## Android sync

- [ ] Grant SMS permission → manual "Sync now" uploads bank SMS
- [ ] Background task runs (or foreground fallback after 12h) without user action
- [ ] Local notifications show: preparing → reading → uploading → complete/failed
- [ ] New bank debit SMS becomes a transaction after sync + Tines parse

## Duplicate protection

- [ ] Same SMS uploaded twice → `DUPLICATE` status, no second transaction
- [ ] Similar amount/date/merchant within fingerprint window → linked to existing txn
- [ ] OTP/promotional SMS → `SKIPPED`, no transaction

## iOS manual import

- [ ] Paste bank SMS on manual import screen → transaction created
- [ ] Invalid/non-transactional paste → skipped or clarification, no crash

## API & Tines

- [ ] `POST /api/user/sms/sync` accepts batch ≤ `SMS_SYNC_MAX_BATCH`
- [ ] Tines `sms-batch-parse` story receives webhook and calls `/api/webhooks/tines-bridge`
- [ ] `SmsIngestMessage` status updates to PARSED / DUPLICATE / SKIPPED / FAILED

## Web

- [ ] Customer settings shows read-only SMS import status card

## Google Play compliance

- [ ] SMS permission declaration: **financial account management**
- [ ] In-app disclosure shown before SMS permission request
- [ ] Privacy policy mentions SMS content sent for parsing and retention

## Environment

- [ ] `SMS_TINES_WEBHOOK_URL` and `SMS_TINES_WEBHOOK_SECRET` set in production
- [ ] `TINES_BRIDGE_SECRET` unchanged for callback auth
- [ ] Prisma migration `20260922130000_sms_import` applied
