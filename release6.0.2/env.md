# Monthly digest environment variables

Scheduled sends use **Trigger.dev** task `monthly-digest-dispatch` (see `trigger-monthly-digest.md`). Sync these vars to your Trigger.dev project (also listed in `trigger.config.ts` `syncEnvVars`).

```env
# Required for production sends (same as other product emails)
ENABLE_RESEND=true
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Protects POST /api/internal/monthly-digest and /preview
MONTHLY_DIGEST_DISPATCH_SECRET=
# Falls back to REMINDER_DISPATCH_SECRET if unset

MONTHLY_DIGEST_EMAIL_LIMIT=3000
MONTHLY_DIGEST_BATCH_SIZE=100
MONTHLY_DIGEST_TEST_RECIPIENT=you@example.com

# Trigger prod only — leave false/unset until go-live (cron no-ops when not "true")
MONTHLY_DIGEST_SCHEDULER_ENABLED=false
```

See [`trigger-setup.md`](./trigger-setup.md) for the full Trigger.dev checklist.
