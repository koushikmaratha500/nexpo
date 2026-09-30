# Dev blocked? — Release 6.x diagnosis

## What broke

Your **code** (`prisma/schema.prisma` + generated Prisma Client) expects **6.x database columns and tables**.  
Your **Supabase DB** was never migrated (`P3005` on `migrate deploy` = DB already has old schema, no `_prisma_migrations` baseline).

### Symptoms

| Symptom | Cause |
|--------|--------|
| Login / Google sign-in 500 | `User` queries select `accountLifecycleMode`, … — **column does not exist** |
| Transactions / dashboard 500 | `Transaction.lifecycleBatchId` missing |
| Settings partly works | Account/SMS cards hide on API error; **core app still fails on login** |
| `migrate deploy` → P3005 | No migration history on a non-empty DB |

**Build passes** (`npm run build`) — this is a **runtime DB mismatch**, not TypeScript.

## Fix (required once per environment)

Use **direct** Postgres URL (`DIRECT_URL` in `.env.local`, same as `prisma.config.ts`).

### Option 1 — CLI (recommended)

```bash
cp .env.example .env.local   # if needed; set DIRECT_URL + DATABASE_URL
npm run db:push
```

### Option 2 — Supabase SQL Editor

Run the full script: `scripts/consolidated-schema-6x.sql`

Then baseline Prisma (optional, for `migrate deploy` later):

```bash
npx prisma migrate resolve --applied "20260922130000_sms_import"
npx prisma migrate resolve --applied "20260927120000_account_lifecycle_6_0_1"
npx prisma migrate deploy   # should report nothing pending
```

## Safe push strategy (6.0.1 preview, 6.1 off)

1. **Sync DB** on preview (and local) with `db push` or consolidated SQL **before or with** the deploy.
2. **Leave SMS UI off** (default): do not set `NEXT_PUBLIC_ENABLE_SMS_IMPORT` / `EXPO_PUBLIC_ENABLE_SMS_IMPORT`.
3. **6.0.1** Account data card works after DB has lifecycle columns.
4. When ready for 6.1: set env flags to `true` + Tines/SMS config.

## What we changed to reduce crash surface

- Login: account lifecycle **recovery** wrapped in try/catch (won’t block login if recovery fails).
- SMS import UI + mobile background task: **off unless** `*_ENABLE_SMS_IMPORT=true`.
- **Does not** remove the need for DB sync — Prisma still reads new `User` / `Transaction` columns on every request.

## Do not commit

- `paysasuchan-signed-key.jks` — add to `.gitignore`, never push.

## Consolidated change buckets (for your push)

| Bucket | Safe after DB sync? | Notes |
|--------|---------------------|--------|
| 6.0.1 account lifecycle API + UI | Yes | Preview focus |
| 6.1 SMS API | Yes (unused if UI flag off) | Tables must exist if anything calls `/api/user/sms/*` |
| Bot/Tines SMS channel | Yes | Only when Tines sends `channel=sms` |
| Mobile SMS packages | Yes | Inert when flag off |
