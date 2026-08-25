# Corporate Pro Ledger (nexpo)

A responsive Next.js application implementing the **Global Spend SaaS Tracker** from the Stitch design system. Built with Tailwind CSS v4 and designed to support Mobile, Tablet, and Desktop resolutions.

**Release 4.1** adds shared groups with expense splits, payment reminders, in-app notifications, optional OneSignal push, admin notification policy, and customer notification preferences.

---

## Simulated Accounts & Login Credentials

Reference data (currencies, categories, etc.) is seeded by default. **Demo login accounts are only created when `SEED_DEMO_DATA=true`.**

When demo seeding is enabled:

* **Administrator:** `admin@nexpo.com`
* **Customer:** `user@nexpo.com`
* **Password:** value of `SEED_DEMO_PASSWORD` (default `ChangeMe-Demo-123!`)

```bash
SEED_DEMO_DATA=true SEED_DEMO_PASSWORD='your-local-demo-password' npx prisma db seed
```

---

## Configuration & Environment Variables

Create a `.env.local` file in the root of your directory (see `.env.example`).

### Core

```env
JWT_SECRET=your-long-random-secret
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SHOW_TESTING_HELPER=false
```

### Release 4.1 — Email OTP gate

```env
ENABLE_RESEND=false          # false → OTP verify with DEV_OTP_CODE (default 123456)
RESEND_API_KEY=              # required when ENABLE_RESEND=true
RESEND_FROM_EMAIL=noreply@nexpo.com
DEV_OTP_CODE=123456
EXPOSE_DEV_RESET_TOKEN=false # dev-only password reset token exposure
```

### Release 4.1 — Push & reminders

```env
NEXT_PUBLIC_ONESIGNAL_APP_ID=
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
REMINDER_DISPATCH_SECRET=      # protects POST /api/internal/reminders/dispatch
```

### AI (Release 3.0)

```env
OPENROUTER_API_KEY=
# AI_ENABLED=true
# AI_MODEL_OCR=google/gemma-4-26b-a4b-it:free
# AI_MODEL_CHAT=openrouter/free
# AI_MODEL_STRUCTURED=openrouter/free
```

See `release4.1/plan.md` for the full variable matrix and `release4.1/migration-4.0-to-4.1.md` when upgrading from 4.0.

---

## Project Structure & Architecture

* **API (`/app/api/user/*`, `/app/api/admin/*`, `/app/api/internal/*`):** Layered controllers → services → repositories (see `AGENTS.md`).
* **Groups:** `/api/user/groups/*` — membership, group transactions/splits, balances, reminders, settlement CSV export.
* **Notifications:** `/api/user/notifications/*`, `/api/user/notification-preferences`, `/api/user/reminders/*`.
* **Internal cron:** `POST /api/internal/reminders/dispatch` (header `x-reminder-dispatch-secret`).
* **State (`/store`):** Zustand stores — `authStore`, `transactionStore`, `themeStore`.
* **Feature Components (`/components/features`):** auth, transactions, dashboard, assistant, groups, notifications, reminders, support.
* **Layouts (`/app`):** Role paths `/admin` and `/customer`.

Personal transaction APIs filter `groupId IS NULL`. Group expenses live under group routes only.

### Mobile app (Expo — same repo, not deployed to Vercel)

```
nexpo/
├── app/, lib/, components/   # Next.js → Vercel
├── mobile/                   # Expo React Native → git only
└── packages/shared/          # @nexpo/shared API client + types
```

* Root **`.vercelignore`** excludes `mobile/` and `packages/` from Vercel uploads.
* Mobile calls the same HTTP APIs; server/Prisma code is never bundled into the app.
* Setup and run: see **`mobile/README.md`**.

```bash
cp mobile/.env.example mobile/.env   # set EXPO_PUBLIC_API_URL
npm run mobile                       # Expo dev server
```

---

## Local Development Execution

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Rate limits

See `release4.0/api-contract.md` for the full table. High-risk routes return `{ error }` with HTTP **429** when exceeded. In production, configure Upstash Redis or Vercel KV — the app **fail-closes** (503) if rate limiting is unavailable.

### Release gate

```bash
npm run lint
npm run test:all
JWT_SECRET=test npm run build
```

Manual checklist: `release4.1/regression-checklist.md`.

### Reminder dispatch (staging/prod)

Schedule daily:

```bash
curl -X POST -H "x-reminder-dispatch-secret: $REMINDER_DISPATCH_SECRET" \
  https://your-host/api/internal/reminders/dispatch
```

---

## Upgrading from 4.0

1. `npm run db:push && npm run db:seed`
2. `npx tsx scripts/backfill-usernames.ts` for existing users
3. Follow `release4.1/migration-4.0-to-4.1.md`
