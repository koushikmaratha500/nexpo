# Release 4.0 → 4.1 Migration Guide

This guide covers database and operational steps when upgrading from Release 4.0 to 4.1.

## 1. Pull latest code and install

```bash
npm install
```

## 2. Apply schema changes

Release 4.1 adds groups, group transactions/splits, reminders, notifications, and admin settings models.

```bash
npm run db:push
npm run db:seed
```

Review `release4.1/schema-draft.prisma` for the full proposed model list if you maintain custom migrations.

## 3. Backfill usernames (required for group invites)

Release 4.1 introduces optional-but-required-on-new-signup `User.username`. Existing users without a username cannot be invited by username until backfilled.

Dry-run by inspecting users first, then run:

```bash
npx tsx scripts/backfill-usernames.ts
```

The script generates lowercase usernames from email local-part (or first name) and resolves collisions with numeric suffixes.

## 4. Environment variables

Copy new keys from `.env.example`:

| Variable | Purpose |
|----------|---------|
| `ENABLE_RESEND` | `false` (default) uses OTP `123456`; `true` sends real email via Resend |
| `DEV_OTP_CODE` | Override dev OTP (default `123456`) |
| `ONESIGNAL_APP_ID` / `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Push notifications |
| `ONESIGNAL_REST_API_KEY` | Server-side OneSignal REST (never expose to browser) |
| `REMINDER_DISPATCH_SECRET` | Protects `POST /api/internal/reminders/dispatch` |

## 5. Removed customer routes

These redirect-only pages were deleted in 4.1-S1:

- `/customer/credit`
- `/customer/expenses`
- `/credit`

Use `/customer/transactions` directly.

## 6. Personal vs group transactions

Personal APIs now filter `Transaction.groupId IS NULL`. Group expenses appear only under group endpoints and UI tabs.

## 7. Reminder email dispatch (cron)

Schedule a daily job (Vercel Cron, GitHub Action, or external scheduler):

```bash
curl -X POST \
  -H "x-reminder-dispatch-secret: $REMINDER_DISPATCH_SECRET" \
  "https://your-app.example/api/internal/reminders/dispatch"
```

Optional `?date=YYYY-MM-DD` processes a specific day (useful in staging).

Email sends only when **all** are true:

1. `ENABLE_RESEND=true`
2. Admin `notifications.emailRemindersEnabled`
3. User email preference enabled
4. Reminder includes `EMAIL` channel

## 8. Verification checklist

Run automated gate:

```bash
npm run lint
npm run test:all
JWT_SECRET=test npm run build
```

Then walk through `release4.1/regression-checklist.md`.

## 9. Rollback notes

- Schema additions are additive; rolling back code without reverting schema leaves unused tables (safe).
- If rolling back UI only, keep `db:push` schema — 4.0 code ignores new tables.
- Username backfill is one-way; export usernames before rollback if needed.
