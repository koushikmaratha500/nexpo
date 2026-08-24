# Corporate Pro Ledger (nexpo)

A responsive Next.js application implementing the **Global Spend SaaS Tracker** from the Stitch design system. Built with Tailwind CSS v4 and designed to support Mobile, Tablet, and Desktop resolutions.

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

Create a `.env.local` file in the root of your directory (see `.env.example`):

```env
# Required — app fails to sign/verify JWTs without this
JWT_SECRET=your-long-random-secret

# Database (Prisma)
DATABASE_URL=

# Supabase — required for document uploads (SUPABASE_SERVICE_ROLE_KEY in production)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Set to 'true' to display the floating role-switcher widget in dashboard layouts.
# Set to 'false' in production configurations to hide this testing utility.
NEXT_PUBLIC_SHOW_TESTING_HELPER=true

# Dev only: expose admin reset token in forgot-password API (never in production)
# EXPOSE_DEV_RESET_TOKEN=true

# --- AI (Release 3.0) ---
# OpenRouter key for the Vercel AI SDK layer. Server-side only.
OPENROUTER_API_KEY=
# Optional per-feature model overrides (defaults):
# ocr=google/gemma-4-26b-a4b-it:free, chat/structured=openrouter/free
# AI_ENABLED=true
# AI_MODEL_OCR=google/gemma-4-26b-a4b-it:free
# AI_MODEL_CHAT=openrouter/free
# AI_MODEL_STRUCTURED=openrouter/free
```

---

## Project Structure & Architecture

* **API (`/app/api/user/*`, `/app/api/admin/*`):** Layered controllers → services → repositories (see `AGENTS.md`). Legacy mock JSON routes (`/api/expenses`, `/api/credits`) were removed in Release 4.0 remediation.
* **State (`/store`):** Zustand stores — `authStore`, `transactionStore`, `themeStore`.
* **Global Components (`/components/ui`):** Reusable layout-agnostic interfaces (e.g. `Button`, `Card`, `Modal`, `Table`).
* **Feature Components (`/components/features`):** Domain UI (auth, transactions, dashboard, assistant, reports).
* **Authentication Context (`/components/auth`):** Context provider managing route redirection, authentication validation checks, and user session storage.
* **Layouts & Subpages (`/app`):** Dynamic page modules organized under role paths (`/admin` and `/customer`) with fluid responsive grids and bento spacing.

---

## Local Development Execution

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Rate limits

See `release4.0/api-contract.md` for the full table. High-risk routes return `{ error }` with HTTP **429** when exceeded. In production, configure Upstash Redis or Vercel KV — the app **fail-closes** (503) if rate limiting is unavailable.

To validate production correctness, compile the bundle:

```bash
npm run build
```
