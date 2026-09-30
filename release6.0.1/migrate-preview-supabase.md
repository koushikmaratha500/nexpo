# 6.0.1 — Fix P3005 and migrate preview (Supabase)

## Why you see `P3005`

Prisma found **2 migration folders** in `prisma/migrations/`, but your Supabase database already has tables (built earlier with `db push` or manual SQL) and **no `_prisma_migrations` history** (or an empty one). `migrate deploy` refuses to run on a non-empty DB without a baseline.

Migrations in this repo (in order):

1. `20260922130000_sms_import` — 6.1 SMS (safe to apply on preview even if you only test 6.0.1)
2. `20260927120000_account_lifecycle_6_0_1` — **6.0.1** reset/delete

## Use the direct database URL

In `prisma.config.ts`, migrations use **`DIRECT_URL`** (not the pooler).

In Supabase: **Project Settings → Database → Connection string → URI → Direct connection** (port `5432`).

Set in `.env.local`:

```env
DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
# Use the *direct* host if Supabase shows db.[ref].supabase.co — prefer that for DDL
DATABASE_URL="..." # pooler OK for the app
```

---

## Path A — Fastest for preview only (recommended now)

Applies schema changes **without** fixing migration history:

```bash
cd /path/to/nexpo
npx prisma db push
```

Confirm it wants to add `AccountLifecycleMode`, User lifecycle columns, `Transaction.lifecycleBatchId`, and (if missing) SMS tables. Then redeploy preview.

**Downside:** `migrate deploy` will still hit P3005 until you baseline (Path B).

---

## Path B — Proper baseline, then `migrate deploy`

### 1. See what the DB is missing

```bash
npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

If this prints SQL, the DB is behind `schema.prisma`. You can apply it:

```bash
npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/preview-catch-up.sql
# Review /tmp/preview-catch-up.sql, then:
npx prisma db execute --file /tmp/preview-catch-up.sql
```

Or apply only 6.0.1:

```bash
npx prisma db execute --file prisma/migrations/20260927120000_account_lifecycle_6_0_1/migration.sql
```

(If SMS tables are missing, run the sms migration file too, or use Path A `db push`.)

### 2. Mark migrations as applied (baseline)

After the **live database matches** what each migration would create:

```bash
npx prisma migrate resolve --applied "20260922130000_sms_import"
npx prisma migrate resolve --applied "20260927120000_account_lifecycle_6_0_1"
```

Skip the SMS line **only if** that migration’s SQL was never applied **and** you removed that folder (not recommended — apply SMS migration on preview instead).

### 3. Verify

```bash
npx prisma migrate deploy
```

Should print: **No pending migrations to apply.**

---

## Path C — 6.0.1 SQL only in Supabase Dashboard

1. Open **SQL Editor** in Supabase.
2. Paste contents of `prisma/migrations/20260927120000_account_lifecycle_6_0_1/migration.sql`.
3. Run.
4. Use Path B step 2 to `migrate resolve` both migration names (after SMS is also applied or baselined).

---

## Checklist after migrate

```sql
-- User lifecycle columns
SELECT "accountLifecycleMode" FROM "User" LIMIT 1;

-- Prisma history
SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at;
```

Then test preview: Settings → Account data → Email OTP → reset flow.
