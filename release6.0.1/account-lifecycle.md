# Release 6.0.1 — Account reset & delete

## Reset account

- Hides all **personal** transactions immediately (`groupId` is null).
- Clears SMS import fingerprints and ingest messages for a clean slate.
- Data is **retained for 7 days**, then hard-deleted by the daily purge job.
- Signing in again within 7 days **restores** transactions automatically (or use **Restore** in Settings).

## Delete account

- Schedules full account removal after **7 days**.
- All sessions are invalidated immediately (user is signed out).
- Signing in within 7 days **cancels** deletion and restores the account.

## API (customer)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/user/account/lifecycle` | Current mode & recovery window |
| POST | `/api/user/account/otp/send` | Body: `{ action: "RESET"\|"DELETE", channel: "email"\|"sms" }` |
| POST | `/api/user/account/reset` | Body: `{ confirmation: "RESET", channel, otp }` |
| POST | `/api/user/account/delete` | Body: `{ confirmation: "DELETE", channel, otp }` |
| POST | `/api/user/account/restore` | Cancel pending reset/delete within window |

## Operations

- Trigger.dev: `account-lifecycle-purge` (daily 03:15 IST)
- Internal: `POST /api/internal/account-lifecycle/purge` with `REMINDER_DISPATCH_SECRET` or `ACCOUNT_LIFECYCLE_DISPATCH_SECRET`

## OTP delivery

- **Email:** Resend (`RESEND_API_KEY`) — same Redis-backed OTP store as registration (15 min TTL, 5 attempts).
- **SMS:** Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`) using the user’s `mobile` field.
- **Dev:** Without Resend/Twilio, codes use `DEV_OTP_CODE` (default `123456`) and are logged to the server console.

## Migration

`20260927120000_account_lifecycle_6_0_1`
