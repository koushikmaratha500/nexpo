# Corporate Pro Ledger (nexpo)

A responsive Next.js application implementing the **Global Spend SaaS Tracker** from the Stitch design system. Built with Tailwind CSS v4 and designed to support Mobile, Tablet, and Desktop resolutions.

---

## Simulated Accounts & Login Credentials

Authentication is simulated locally based on the following preset profiles:

* **Administrator Profile**
  * **Email:** `admin@nexpo.com`
  * **Password:** Any character string longer than **6 characters** (e.g. `admin1234`)
  * **Default View:** Dashboard Overview, User & Category Management, Global Reports

* **Standard User (Customer) Profile**
  * **Email:** `user@nexpo.com`
  * **Password:** Any character string longer than **6 characters** (e.g. `user1234`)
  * **Default View:** Personal Dashboard, Expense Slips Recording & List, Statement Reports

---

## Configuration & Environment Variables

Create a `.env.local` file in the root of your directory to customize testing features:

```env
# Set to 'true' to display the floating role-switcher widget in dashboard layouts.
# Set to 'false' in production configurations to hide this testing utility.
NEXT_PUBLIC_SHOW_TESTING_HELPER=true

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

* **Mock Module (`/mock`):** Contains central mock datasets including default users, transactions, spend distributions, and system growth metrics.
* **Global Components (`/components/ui`):** Reusable layout-agnostic interfaces (e.g. `Button`, `Card`, `Modal`, `Table`).
* **Authentication Context (`/components/auth`):** Context provider managing route redirection, authentication validation checks, and user session storage.
* **Layouts & Subpages (`/app`):** Dynamic page modules organized under role paths (`/admin` and `/customer`) with fluid responsive grids and bento spacing.

---

## Local Development Execution

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

To validate production correctness, compile the bundle:

```bash
npm run build
```
