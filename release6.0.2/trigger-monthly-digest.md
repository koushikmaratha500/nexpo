# Trigger.dev — Monthly Money Digest (Release 6.0.2)

## Scheduled task

| Field | Value |
|-------|--------|
| Task id | `monthly-digest-dispatch` |
| Cron | `0 9 1 * *` |
| Timezone | `Asia/Calcutta` (IST) |
| Source | [`trigger/monthly-digest-dispatch.ts`](../../trigger/monthly-digest-dispatch.ts) |

On each run, `MonthlyDigestDispatchService` computes the **previous calendar month** (e.g. 1 Oct 09:00 IST → September) and sends eligible users their digest via Resend.

## Ready vs live

- **Deploy** registers the schedule in Trigger.dev (`npm run trigger:deploy`).
- **Live sends** require `MONTHLY_DIGEST_SCHEDULER_ENABLED=true` in Trigger **prod** (default off). See [`trigger-setup.md`](./trigger-setup.md).

## Deploy

```bash
npx trigger.dev@latest login
npm run trigger:dev    # local worker (DEV)
npm run trigger:deploy # production schedules (you run when ready)
```

Ensure Trigger environment variables include at least:

- `DATABASE_URL`, `DIRECT_URL`
- `ENABLE_RESEND`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `MONTHLY_DIGEST_EMAIL_LIMIT` (optional, default 3000)
- `MONTHLY_DIGEST_BATCH_SIZE` (optional, default 100)
- `NEXT_PUBLIC_APP_URL`

## Manual / QA (no Trigger)

Use the internal API (same service as the task):

```bash
# Dry run counts
curl -sS -X POST -H "Content-Type: application/json" \
  -H "x-monthly-digest-dispatch-secret: $MONTHLY_DIGEST_DISPATCH_SECRET" \
  -d '{"period":"previous_month","mode":"preview"}' \
  https://<your-host>/api/internal/monthly-digest

# Send test email
curl -sS -X POST -H "Content-Type: application/json" \
  -H "x-monthly-digest-dispatch-secret: $MONTHLY_DIGEST_DISPATCH_SECRET" \
  -d '{"period":"2026-09","mode":"test","testRecipient":"you@example.com","userId":"<uuid>"}' \
  https://<your-host>/api/internal/monthly-digest

# Preview HTML
curl -sS -X POST -H "Content-Type: application/json" \
  -H "x-monthly-digest-dispatch-secret: $MONTHLY_DIGEST_DISPATCH_SECRET" \
  -d '{"userId":"<uuid>","period":"2026-09"}' \
  https://<your-host>/api/internal/monthly-digest/preview
```

If the job is **blocked** (`monthly_email_limit_exceeded`), the Trigger run fails so you get alerted in the Trigger.dev dashboard.
