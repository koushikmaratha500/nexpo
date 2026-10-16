# Trigger.dev setup — Monthly digest (ready, not live)

Project: **pro-trigger** (`proj_wsuptnvrcwjcvnlmdfxn`) — matches [`trigger.config.ts`](../trigger.config.ts).

The scheduled task is defined in code (`monthly-digest-dispatch`). **Production sends are gated** by `MONTHLY_DIGEST_SCHEDULER_ENABLED=true`. Until you set that in Trigger **prod**, cron runs will no-op with status `disabled` (safe to deploy early).

## 1. Validate locally (optional)

```bash
npm run trigger:dev
```

Confirm `monthly-digest-dispatch` appears under Schedules in the [Trigger dashboard](https://cloud.trigger.dev/orgs/protitos-a4cb/projects/pro-trigger-Nn33).

Dry-run bundle (no deploy):

```bash
npx trigger.dev@latest deploy --dry-run
```

## 2. Trigger **prod** environment variables

Set in **Trigger.dev → pro-trigger → Environment variables → Production** (do **not** set `MONTHLY_DIGEST_SCHEDULER_ENABLED` until go-live):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Same as app |
| `DIRECT_URL` | Yes | Prisma |
| `ENABLE_RESEND` | Yes | `true` for real sends |
| `RESEND_API_KEY` | Yes | |
| `RESEND_FROM_EMAIL` | Yes | Verified domain |
| `NEXT_PUBLIC_APP_URL` | Yes | Production app URL |
| `MONTHLY_DIGEST_EMAIL_LIMIT` | Optional | Default `3000` |
| `MONTHLY_DIGEST_BATCH_SIZE` | Optional | Default `100` |
| `MONTHLY_DIGEST_SCHEDULER_ENABLED` | **Go-live only** | Leave unset or `false` until you want cron to send |

`syncEnvVars` in `trigger.config.ts` copies these from your deploy environment when you run `npm run trigger:deploy` (if present in the shell `.env`).

## 3. Deploy task (you run when ready)

```bash
npm run trigger:deploy
```

This registers/updates **all** trigger tasks including `monthly-digest-dispatch` (`0 9 1 * *` Asia/Calcutta).

**Optional:** In the Trigger dashboard, open **Schedules → monthly-digest-dispatch** and **disable** the schedule until go-live (belt-and-suspenders with the env flag).

## 4. Go live (when you choose)

1. Resend + digest vars verified on Trigger prod.
2. App DB migration applied (`MonthlyDigestDelivery`).
3. Set `MONTHLY_DIGEST_SCHEDULER_ENABLED=true` on Trigger **prod**.
4. Re-deploy triggers if needed: `npm run trigger:deploy`
5. Run a manual test first: internal API `mode: test` (see `trigger-monthly-digest.md`).

## 5. MCP (Cursor)

If you use Trigger MCP in Cursor:

```bash
npx trigger.dev@latest install-mcp
```

Then restart Cursor. Use MCP to inspect runs/schedules after deploy.
