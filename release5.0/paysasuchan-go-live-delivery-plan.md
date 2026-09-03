# PaysaSuchan — Go-Live Delivery Plan (October 2026)

> **Product rename:** Corporate Pro Ledger / Expensify Pro → **PaysaSuchan**  
> **Target:** Public web launch + mobile **test release** (TestFlight / Play Internal) by **end of October 2026**  
> **Visual reference:** Spendr-style landing (violet primary, gradient hero, gold accents, dark footer)

---

## Executive summary

| Track | Scope | Priority | Target week |
|-------|--------|----------|-------------|
| **A — Brand & theme** | PaysaSuchan tokens, logo placeholders, copy sweep | P0 | W1–W2 |
| **B — Marketing** | Public landing at `/`, auth moved to `/auth/login` | P0 | W1–W2 |
| **G — Google OAuth (Supabase Auth)** | Login + Register with Google; bridge to app JWT | P0 | W3 |
| **C — Bug & AppSec gate** | Known fixes + AP-0 from AppSec plan before public share | P0 | W1–W3 |
| **D — Share receipt (public URL)** | Tokenized public page + OG/screenshot + WhatsApp/SMS | P1 | W2–W4 |
| **E — Group ↔ personal convert** | Hard-delete move with balance/split integrity | P1 | W3–W4 |
| **F — Mobile test release** | EAS, branding, smoke QA, internal testers | P0 | W3–W4 |

**Recommendation:** Ship **W4** as *soft launch* (web + mobile internal) if share-receipt or convert slips; do **not** slip landing + theme + mobile test build.

---

## Theme tokens (from reference screenshot → PaysaSuchan)

Map into `app/globals.css` (`@theme`) and `mobile/src/theme/tokens.js` (NativeWind).

| Token | Role | Proposed value | Usage |
|-------|------|----------------|--------|
| `primary` | Brand violet | `#7C3AED` | Buttons, links, icons, active nav |
| `primary-dark` | Gradient end / footer CTA | `#5B21B6` | Hero gradient, footer band |
| `primary-light` | Soft surfaces | `#F3F0FF` | Feature cards, subtle backgrounds |
| `primary-container` | On-violet text bg | `#6D28D9` | Inverted chips on white |
| `accent-gold` | Rewards / highlights | `#F6AD55` | Badges, coin illustrations (optional) |
| `surface-dark` | Footer / demo button | `#1A202C` | Footer, dark CTA |
| `background` | Page base | `#FFFFFF` | Marketing + app shell |
| `on-primary` | Text on violet | `#FFFFFF` | Hero headlines |
| `secondary` | Success / money-in | keep `#006C49` or shift to teal | Credit transactions |
| `error` | Unchanged | `#BA1A1A` | Debits, validation |

**Gradient (hero / pre-footer):** `linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #4338CA 100%)`

**Typography:** Keep **Figtree** (already loaded web + mobile) — matches modern fintech landing style.

**Components to restyle:** `Button`, `Card`, `SidebarNav`, `Header`, `CustomerTabBar`, auth forms, admin shell — swap black `#000000` primary to violet system.

---

## Workstream A — Rebrand & logo placeholders

### A1. Shared logo component (placeholder-ready)

Create `components/brand/BrandLogo.tsx` (+ `mobile/src/components/brand/BrandLogo.tsx` mirror):

| Prop | Values |
|------|--------|
| `variant` | `full` (icon + wordmark), `icon`, `wordmark` |
| `theme` | `light` (on violet), `dark` (on white), `mono` |
| `size` | `sm` \| `md` \| `lg` |

**Placeholder behavior until final asset:**

- Rounded violet square + **“PS”** monogram + **“PaysaSuchan”** wordmark text
- Single env or constant: `NEXT_PUBLIC_BRAND_LOGO_URL` / `EXPO_PUBLIC_BRAND_LOGO_URL` — when set, render `<Image>` instead of placeholder

### A2. Logo placement checklist

| Location | File / area |
|----------|-------------|
| Public landing `/` | Header + footer |
| Auth (`/auth/*`) | Top of login/register/reset cards |
| Customer shell | `SidebarNav`, mobile header |
| Admin shell | `SidebarNav` |
| Mobile splash / login | `BrandMark.tsx` → replace with `BrandLogo` |
| Email templates | `email.service.ts` header (text → logo URL later) |
| OG / share image | PaysaSuchan wordmark on receipt card |
| `app.json` / favicon | Icon placeholder → swap when logo pack delivered |

### A3. Copy & metadata sweep

Replace strings: `Expensify Pro`, `Corporate Pro Ledger`, `nexpo` (user-facing) → **PaysaSuchan**.

| Keep internal | Change user-facing |
|-------------|-------------------|
| Repo name `nexpo`, npm workspaces | App title, emails, layouts, mobile constants |
| `@nexpo/shared` package name (defer rename to post-launch) | `app.json` `name`, store listing |

**Deliverable:** PR “Brand shell” — tokens + placeholders + copy; **no** broken routes.

---

## Workstream B — Landing home page at `/`

### Current state

- `app/page.tsx` → login wrapper (not a marketing page)
- Customer app lives under `/customer/*`

### Target IA

```
/                     → Public marketing landing (new)
/auth/login           → Customer login (move from /)
/auth/register        → (optional link from landing)
/customer/*           → Authenticated app (unchanged)
/admin/*              → Admin (unchanged)
```

### Landing sections (match reference structure)

1. **Header** — logo, Features, Partners (anchor), Sign In, Get Demo / Start free  
2. **Hero** — headline, subcopy, App Store / Play badges (placeholder), QR placeholder, phone mockup  
3. **Feature rows** — 3 alternating blocks (personal ledger, groups/splits, AI assistant)  
4. **Social proof** — partner logo strip + testimonial carousel (placeholder content)  
5. **“Elevate your experience”** — 3 lavender cards  
6. **Pre-footer CTA** — violet gradient + “Get started”  
7. **Footer** — dark navy, links, legal, logo  

**Tech:** New `app/(marketing)/page.tsx` or `app/page.tsx` + route group; reuse Tailwind tokens; **no auth required**.

**CTAs:** Sign In → `/auth/login`; Get Started → `/auth/register` or `/customer` if session exists (redirect in middleware optional W2).

**Gate:** Lighthouse mobile ≥ 85 performance (static assets); responsive 375px–1440px.

---

## Workstream C — Known bug fixes & launch gates

Fix **before** public share URLs go live.

### C1. Already fixed (verify in QA)

| Issue | Status |
|-------|--------|
| Receipt “Extract with AI” hidden for JPG with empty MIME | Fixed (`lib/files/receiptImage.ts`) |
| OCR model single-point rate limit | Fixed (fallback chain in `lib/ai/config.ts`) |
| AI SDK deprecated `image` content part | Fixed (`file` part in `receipt.agent.ts`) |

### C2. Must-fix for go-live (from AppSec + product)

| ID | Item | Effort |
|----|------|--------|
| C2.1 | Prod OTP guard (`ENABLE_RESEND=false` blocked in production) | S |
| C2.2 | Upload magic-byte validation | S |
| C2.3 | Mobile JWT **only** in SecureStore (remove from AsyncStorage persist) | S |
| C2.4 | Rate limits on `/api/upload`, group writes, share endpoint | M |
| C2.5 | Complete mobile NativeWind theme pass (violet tokens) | M |
| C2.6 | `npm run test:all` + `release4.1/regression-checklist.md` green | M |

### C3. Acceptable to defer post-launch (document risk)

| Item | Reason |
|------|--------|
| httpOnly cookie migration | Large change |
| Private Supabase signed URLs | Requires bucket policy change |
| Full root ESLint cleanup | Non-blocking for users |

**Reference:** `release4.1/appsec-remediation-plan.md` phases AP-0 → AP-2.

---

## Workstream D — Share receipt (public URL + screenshot)

### Product behavior

1. User opens transaction (personal or group they can view) → **Share receipt**  
2. System creates **unguessable share token** (UUID v4 or 32-byte hex)  
3. Public URL: `https://paysasuchan.com/r/{token}` (no auth)  
4. Page shows: branded receipt card (amount, date, merchant, category, split summary if group)  
5. **Generated screenshot/OG image** for WhatsApp/SMS preview  
6. Actions: Copy link, **WhatsApp**, **SMS**, native share (mobile)

### Security requirements (mandatory)

| Control | Detail |
|---------|--------|
| Token entropy | ≥ 128 bits; not sequential |
| Expiry | Default 7 days; configurable; max 30 days |
| Revoke | Owner can revoke share |
| Scope | Read-only; no edit; no other transactions |
| Rate limit | Create share: 20/day/user; public GET: IP rate limit |
| PII | Optional: hide notes; mask merchant partially in settings later |
| Audit | `TransactionShare` created/revoked logged |

### Schema (draft)

```prisma
model TransactionShare {
  id            String   @id @default(uuid())
  token         String   @unique
  transactionId String
  createdById   String
  expiresAt     DateTime
  revokedAt     DateTime?
  imageUrl      String?  // cached OG PNG in Supabase
  createdAt     DateTime @default(now())
  transaction   Transaction @relation(...)
}
```

### API

| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/user/transactions/[id]/share` | Customer + owns/can view txn |
| DELETE | `/api/user/shares/[id]` | Owner revoke |
| GET | `/api/public/receipts/[token]` | Public (token only) |

### Image generation options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| `@vercel/og` (ImageResponse) | Fast, serverless | Layout limits | **MVP** for OG + download PNG |
| Puppeteer screenshot of `/r/[token]` | Pixel-perfect | Heavy, cold start | Phase 2 if OG insufficient |
| Client canvas (mobile) | Offline share | Not for public URL preview | Mobile supplement only |

### WhatsApp / SMS

- WhatsApp: `https://wa.me/?text=${encodeURIComponent(text + url)}`  
- SMS: `sms:?body=...` (mobile web / app)  
- Message template: *“Receipt from PaysaSuchan — ₹X at Merchant on Date: {url}”*

### UI touchpoints

- Web: transaction row menu + detail modal  
- Mobile: transaction long-press / share icon  
- Public page: `app/r/[token]/page.tsx` (SSR for OG tags)

**Effort:** **L (5–8 dev-days)** including tests + AppSec review.

---

## Workstream E — Convert group ↔ personal transaction

### Product behavior

- **Personal → Group:** User selects target group; transaction moves to group ledger; **hard-deletes** personal record (new group txn created OR in-place mutation — pick one; user asked hard delete old)  
- **Group → Personal:** Member/admin per ACL moves to personal ledger; splits removed; group balances recalc  

### Rules

| Rule | Detail |
|------|--------|
| ACL | Personal→Group: user must be group member; Group→Personal: creator or group ADMIN |
| Splits | Deleting group txn removes `GroupExpenseSplit` rows; recalc balances |
| Audit | Log CONVERT action on both sides (old id → new id) |
| Idempotency | Prevent double-convert mid-request |
| Mobile + web | Same API |

### API

`POST /api/user/transactions/[id]/convert`

```json
{ "target": "personal" | "group", "groupId": "uuid-if-group" }
```

Response: `{ "newTransactionId", "deletedTransactionId" }`

**Implementation note:** Use DB transaction (Prisma `$transaction`): create new row → copy fields → delete old row + splits → audit. Do **not** leave orphan splits.

**Effort:** **M (3–5 dev-days)** + integration tests in `tests/integration/groups/`.

---

## Workstream G — Google OAuth (Supabase Auth)

### Product behavior

- Customer **Login** (`/auth/login`) and **Register** (`/auth/register`) offer **Continue with Google** alongside email/password.
- OAuth provider: **Supabase Auth → Google** (configured in Supabase Dashboard).
- After Google consent, user lands on `/auth/callback/complete` and receives the same **app JWT session** as email login (existing `Session` table + `authGuard`).
- **New Google users:** auto-provisioned in Prisma (`provider: GOOGLE`, `status: A`, `emailVerified: true`) — no OTP step.
- **Existing email users:** same email can sign in with Google (account linked by email).

### Architecture

```
Browser → supabase.auth.signInWithOAuth({ provider: 'google' })
       → /auth/callback (exchangeCodeForSession)
       → /auth/callback/complete
       → POST /api/user/auth/google { accessToken }
       → AuthService.loginWithGoogle → app JWT
       → AuthContext setAuth → /customer
```

| Layer | File |
|-------|------|
| UI | `components/features/auth/GoogleSignInButton.tsx` |
| OAuth callback | `app/auth/callback/route.ts` |
| Session bridge | `app/api/user/auth/google/route.ts` |
| Service | `AuthService.loginWithGoogle` |
| Token verify | `lib/supabase/verifyAccessToken.ts` |

### Supabase Dashboard setup (required)

1. **Authentication → Providers → Google** — enable, add Google Cloud OAuth client ID/secret.
2. **Authentication → URL Configuration** — add redirect URLs:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://<prod-domain>/auth/callback` (prod)
3. Env (already used for storage): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### W3 deliverables

| Item | Status |
|------|--------|
| Google button on Login + Register | Done (web) |
| OAuth callback + app JWT bridge | Done (web) |
| Auto-provision Google users in Prisma | Done |
| Share UI web (create, copy, WhatsApp, revoke, list) | Done |
| Share UI mobile (personal + group transactions) | Done |
| Expired share purge (Trigger.dev daily cron) | Done |
| Convert transaction API + web UI | Done |
| Convert transaction mobile UI | Done |
| AppSec AP-0 (OTP guard, magic bytes, timing-safe dispatch, upload rate limit) | Done |
| Mobile JWT only in SecureStore | Done |
| Unit/integration tests (magic bytes, convert schema, Google login, dispatch auth) | Done |
| Mobile Google sign-in (Expo AuthSession) | Done |

**Effort:** **M (2–3 dev-days)** web; +1–2 days for mobile.

---

## Workstream F — Mobile test release

### Prerequisites

| Item | Action |
|------|--------|
| EAS project | `eas init`, `eas.json` profiles `preview` + `production` |
| Bundle IDs | `com.paysasuchan.app` (placeholder until final) |
| Env | `EXPO_PUBLIC_API_URL` → staging/prod API |
| Icons/splash | Placeholder violet “PS” until logo pack |
| SecureStore-only token | Workstream C2.3 |

### Test release checklist

- [ ] Login / logout / session restore  
- [ ] Dashboard, transactions CRUD, receipt attach  
- [ ] Groups list/detail, splits, balances  
- [ ] Reminders, notifications list  
- [ ] Share receipt (after Workstream D)  
- [ ] Convert txn (after Workstream E)  
- [ ] Google sign-in (web + mobile)  
- [ ] Offline/error states (API unreachable toast)  
- [ ] iOS TestFlight + Android internal track  

**Checklist doc:** `release5.0/w4-test-release-checklist.md`

**Distribution:** 5–10 internal testers Week 4; collect feedback doc.

---

## 4-week schedule (Sep 8 – Oct 3, 2026)

Assumes **1 full-stack dev** + **designer (logo W2)** + **QA part-time W3–W4**. Adjust if team size differs.

### Week 1 (Sep 8–14) — Foundation

| Day | Web | Mobile |
|-----|-----|--------|
| Mon–Tue | Theme tokens in `globals.css`; `BrandLogo` placeholder | Mirror tokens in `tokens.js`; `BrandLogo` |
| Wed–Thu | Landing page scaffold (hero + footer); move login to `/auth/login` | Splash/login rebrand |
| Fri | Copy sweep customer/admin/auth; favicon placeholder | Tab bar + header violet theme |

**Exit:** `/` shows landing; login works at `/auth/login`; violet theme visible on web + mobile login.

### Week 2 (Sep 15–21) — Landing polish + share design

| Day | Deliverable |
|-----|-------------|
| Mon–Wed | Complete landing sections + responsive; integrate final logo if ready |
| Thu | Share receipt: schema migration + POST share API + public GET |
| Fri | OG image route (`/api/og/receipt/[token]`) + public page `/r/[token]` |

**Exit:** Share link works in browser; WhatsApp share opens with preview (OG).

### Week 3 (Sep 22–28) — Features + hardening

| Day | Deliverable |
|-----|-------------|
| Mon | **Google OAuth** — verify Supabase provider + prod redirect URLs; smoke test login/register |
| Tue | Share UI web + mobile; revoke; expiry job |
| Wed–Thu | Convert transaction API + UI (web + mobile) |
| Fri | AppSec AP-0 (OTP guard, magic bytes, mobile token fix) |

**Exit:** Google + email auth on web; both new features in staging; security gate items done.

### Week 4 (Sep 29 – Oct 3) — Test release & go-live

| Day | Deliverable | Status |
|-----|-------------|--------|
| Mon | Full regression (`test:all` + manual checklist) | Done (automated); manual QA pending |
| Tue | EAS iOS + Android builds | Config ready (`mobile/eas.json`); run `eas init` + `npm run mobile:build:preview` |
| Wed | TestFlight / Play internal publish | Run after builds; see `production-deploy-checklist.md` |
| Thu | Production deploy web (Vercel); env prod verification | Ops — see `production-deploy-checklist.md` |
| Fri | Soft launch; monitor errors; hotfix window | Ops |

**Exit:** Web live on prod domain; mobile with internal testers; known P0 = 0.

### W4 deliverables (code)

| Item | Status |
|------|--------|
| `eas.json` preview + production profiles | Done |
| Bundle ID `com.paysasuchan.app`, scheme `paysasuchan://` | Done |
| Mobile Google OAuth (AuthSession + JWT bridge) | Done |
| Convert integration tests | Done |
| `.env.example` + mobile `.env.example` | Done |
| W4 test release checklist | Done |
| Production deploy checklist | Done |
| EAS builds submitted to stores | Ops (requires Apple/Play accounts) |
| Vercel prod deploy | Ops |

---

## Dependencies & owners

| Dependency | Owner | Needed by |
|------------|-------|-----------|
| Final logo (SVG + PNG @1x–3x) | Friend / design | W2 (ideal W1 for landing) |
| Production domain + DNS | Ops | W4 |
| Vercel prod env (all 4.1 secrets) | Ops | W4 |
| Apple Developer + Google Play accounts | Ops | W3 |
| OpenRouter / Resend / OneSignal prod keys | Ops | W4 |
| PaysaSuchan copy (hero headline, legal) | Product | W1 |
| AppSec sign-off on public share | Security | W3 |
| Supabase Google OAuth credentials + redirect URLs | Ops | W3 |

---

## Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Logo delayed past W2 | Landing looks placeholder | Ship with monogram; swap via env URL without code change |
| Public share data leak | Critical | Token-only access, expiry, revoke, pentest AP-3 |
| Convert txn breaks balances | High | Prisma transaction + integration tests |
| OCR/AI quota on launch | Medium | Fallback models configured; disable hero “AI scan” on landing if needed |
| Mobile store review delay | Medium | Internal test only in Oct; store public listing Nov |
| Scope creep (full rebrand npm package rename) | Medium | Defer `@nexpo/shared` rename post-launch |

---

## Success criteria (go / no-go)

### Web go-live

- [ ] `/` marketing landing live with PaysaSuchan branding  
- [ ] Violet theme across customer + admin + auth  
- [ ] Logo placeholders swappable in ≤ 1 env change  
- [ ] Share receipt + convert transaction in prod  
- [ ] Google sign-in works on Login + Register (web)  
- [ ] AP-0 AppSec items complete  
- [ ] `npm run test:all` green  

### Mobile test release

- [ ] EAS build installs on iOS + Android  
- [ ] Core flows pass smoke test  
- [ ] Brand + API point to prod/staging consistently  
- [ ] Internal testers onboarded  

---

## Post-launch (November+)

- App Store / Play **public** listing  
- `@nexpo/shared` → `@paysasuchan/shared` (optional monorepo rename)  
- httpOnly session cookies (AP-1.2)  
- Private signed receipt storage  
- WhatsApp Business API (templated messages) vs URL share only  
- Analytics (Plausible / PostHog) on landing  

---

## Related documents

| Doc | Purpose |
|-----|---------|
| `release4.1/plan.md` | 4.1 feature baseline |
| `release4.1/appsec-remediation-plan.md` | Security phases |
| `release4.1/regression-checklist.md` | QA gate (extend for PaysaSuchan) |
| `mobile/README.md` | Expo runbook |

---

*Last updated: 2026-09-03 · PaysaSuchan go-live (W1–W4 code complete; store/deploy ops pending)*
