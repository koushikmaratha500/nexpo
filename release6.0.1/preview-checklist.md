# Release preview checklist (6.0.1 + 6.1 in repo)

Use this before promoting a **preview** deploy (Vercel preview + mobile EAS internal + DB migrate on preview/staging).

---

## Where we are (implementation)

| Area | 6.0.1 Account reset/delete | 6.1 SMS auto-import |
|------|------------------------------|---------------------|
| **Backend** | Done — lifecycle API, OTP, purge job | Done — sync/settings/manual, Tines trigger, dedupe |
| **Web UI** | Done — Settings → Account data | Done — read-only SMS status card |
| **Mobile UI** | Done — Settings → Account data | Done — SmsImportCard, manual import, sync status |
| **DB migrations** | `20260927120000_account_lifecycle_6_0_1` | `20260922130000_sms_import` |
| **Automated tests** | Unit tests for lifecycle service | Unit tests for hash, import service, bot SMS |
| **External setup** | Resend + Redis; Twilio for SMS OTP | Tines story in dashboard; Play SMS declaration |
| **E2E verified** | Not run in this environment | Needs Android **EAS dev build** (not Expo Go) |

---

## Pre-deploy (all previews)

- [ ] Branch built on Vercel preview; `npm run build` green locally or in CI
- [ ] `npx prisma migrate deploy` on **preview/staging** database (both migrations if shipping 6.1)
- [ ] Redis / Upstash available (OTP for 6.0.1 reset/delete **and** registration)
- [ ] Trigger.dev: deploy tasks `account-lifecycle-purge` (6.0.1); existing jobs unchanged for 6.1

---

## 6.0.1 — Account reset & delete

### Environment

- [ ] `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (email OTP)
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` (SMS OTP; optional in dev with `DEV_OTP_CODE`)
- [ ] `REMINDER_DISPATCH_SECRET` or `ACCOUNT_LIFECYCLE_DISPATCH_SECRET` (internal purge fallback)
- [ ] Preview only: `DEV_OTP_CODE=123456` acceptable if Twilio/Resend not wired

### Functional UAT

- [ ] Settings → **Account data** → Email OTP: Send code (reset) → enter OTP → reset → personal transactions hidden
- [ ] Within 7 days: sign in again OR **Restore** → transactions back
- [ ] Send code (delete) → OTP → delete → signed out; sign in within 7 days → account retained
- [ ] After 7 days (or manual `POST /api/internal/account-lifecycle/purge` on staging): reset batch hard-deleted; delete user removed from DB
- [ ] Group transactions unchanged after personal reset
- [ ] Invalid OTP rejected; expired OTP rejected after 15 minutes
- [ ] SMS OTP fails gracefully if user has no `mobile` on file (use email)

### Mobile

- [ ] Same flow on Settings → Account data (email/SMS OTP buttons)

---

## 6.1 — SMS transaction import (if included in preview)

See also `release6.1/uat-checklist.md`.

### Environment

- [ ] `SMS_TINES_WEBHOOK_URL`, `SMS_TINES_WEBHOOK_SECRET`
- [ ] `SMS_SYNC_MAX_BATCH` (optional, default 50)
- [ ] `TINES_BRIDGE_SECRET` for callback
- [ ] Tines story built per `release6.1/tines-sms-story.md` + AI prompt doc

### Functional UAT (high level)

- [ ] Toggle default **on**; disable stops background task (Android)
- [ ] Android EAS build: SMS permission → Sync now → Tines → transaction created
- [ ] Duplicate SMS / fingerprint dedupe
- [ ] iOS manual paste import
- [ ] Web settings read-only status

### Compliance (before Play production)

- [ ] SMS permission declaration (financial account management)
- [ ] In-app disclosure before SMS permission
- [ ] Privacy policy update for SMS parsing

---

## Smoke after deploy

- [ ] Customer login (email + Google mobile)
- [ ] `GET /api/user/account/lifecycle` (authenticated)
- [ ] `GET /api/user/sms/settings` (authenticated)
- [ ] No 500s on customer settings page (web)
- [ ] Mobile settings loads without crash

---

## Out of scope for this preview

- 6.2 Call/Location functional use (permissions requested only on 6.1 Android)
- iOS SMS auto-read (not possible)
- Exact 08:00/20:00 IST sync (OS background fetch ~12h minimum)
