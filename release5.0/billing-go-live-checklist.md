# Billing & payments — go-live checklist

Use this before accepting real money on **staging**, then repeat on **production**.

Related: [`production-deploy-checklist.md`](./production-deploy-checklist.md) (platform-wide), [`w4-test-release-checklist.md`](./w4-test-release-checklist.md) (pre-release QA).

---

## 1. Pre-flight (code + database)

- [ ] Billing Phases 1–5 merged/deployed to the target environment
- [ ] `npx prisma db push` applied (billing tables + `User` plan/billing fields)
- [ ] `npm run test:unit -- tests/unit/planService.test.ts tests/unit/billing*.test.ts tests/unit/checkoutRules.test.ts` green
- [ ] `NEXT_PUBLIC_APP_URL` set to the **staging/production host** (not `localhost`) — used for Stripe return URLs and emails

---

## 2. Environment variables (billing)

Set in **Vercel** (and **Trigger.dev** if dispatch emails must send from workers).

### Seller / invoice (GST)

| Variable | Required | Notes |
|----------|----------|--------|
| `BILLING_LEGAL_NAME` | Yes (prod) | Legal entity on PDF |
| `BILLING_ADDRESS` | Yes (prod) | Billing address on PDF |
| `BILLING_GSTIN` | Yes (prod) | Placeholder OK until filed |
| `BILLING_SAC` | Yes | Default `998314` |
| `BILLING_GST_RATE` | Optional | Default `18` |
| `BILLING_GST_MODE` | Optional | `igst` (default) or `intra` |

### Email (invoices + lifecycle)

| Variable | Required |
|----------|----------|
| `ENABLE_RESEND` | `true` |
| `RESEND_API_KEY` | Yes |
| `RESEND_FROM_EMAIL` | Verified sender |

### Razorpay

| Variable | Required |
|----------|----------|
| `RAZORPAY_KEY_ID` | Yes |
| `RAZORPAY_KEY_SECRET` | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | Yes |
| `RAZORPAY_PLAN_STARTER_MONTHLY` | Yes (Starter subs) |
| `RAZORPAY_PLAN_STARTER_YEARLY` | Yes (Starter subs) |

### Stripe

| Variable | Required |
|----------|----------|
| `STRIPE_SECRET_KEY` | Yes |
| `STRIPE_WEBHOOK_SECRET` | Yes |
| `STRIPE_PRICE_STARTER_MONTHLY` | Yes |
| `STRIPE_PRICE_STARTER_YEARLY` | Yes |
| `STRIPE_PRICE_PRO_LIFETIME` | Yes |

### Background jobs (optional manual curl)

| Variable | Notes |
|----------|--------|
| `BILLING_DISPATCH_SECRET` | Falls back to `REMINDER_DISPATCH_SECRET` |
| `TRIGGER_SECRET_KEY` / `TRIGGER_PROJECT_REF` | Trigger.dev deploy |

**Admin UI:** System Settings → **Billing checkout** → pick `razorpay` or `stripe` (checkout provider only; both webhooks can stay active).

---

## 3. Webhook registration

| Provider | URL | Events to enable |
|----------|-----|------------------|
| **Razorpay** | `https://<host>/api/billing/webhooks/razorpay` | `payment.captured`, `subscription.*`, `invoice.paid` (as configured in gateway) |
| **Stripe** | `https://<host>/api/billing/webhooks/stripe` | `checkout.session.completed`, `invoice.paid`, `customer.subscription.*`, `invoice.payment_failed` |

- [ ] Webhook signing secrets copied into env (`RAZORPAY_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Send a test event from each dashboard → no 4xx in Vercel logs

---

## 4. Staging checkout — step by step

Use **test mode** keys (Razorpay test / Stripe test). Create a **customer** account on staging with a real email you control (for invoice + welcome mail).

### A. Confirm checkout is available

1. Log in as customer → **Settings**.
2. Confirm plan card shows trial/lock state and **Plans** / upgrade opens the modal.
3. Admin → **Settings** → Billing: provider selected and keys configured (no “not configured” on disabled option).

### B. Starter monthly (recurring)

**If Razorpay is the active provider:**

1. Customer → upgrade modal → **Starter monthly**.
2. Razorpay test checkout opens → complete with test card/UPI.
3. Client calls `POST /api/user/billing/verify` → toast “Payment successful”.
4. Refresh Settings → plan shows **Starter · monthly**, writes unlocked.

**If Stripe is the active provider:**

1. Customer → **Starter monthly** → redirect to Stripe Checkout (test).
2. Complete payment → return to `/customer/settings?checkout=success`.
3. Webhook `checkout.session.completed` / `invoice.paid` activates plan (may take a few seconds).
4. Refresh Settings → **Starter · monthly**.

### C. Pro lifetime (one-time)

1. Use a **Freemium** or **Starter** test user (not already Pro).
2. Upgrade modal → **Pro lifetime** → pay (Razorpay verify or Stripe return).
3. If user was on **Starter**, confirm old subscription is canceled (no double charge on next cycle).
4. Settings → **Pro · lifetime**; `currentPeriodEndsAt` empty.

### D. Post-payment verification

- [ ] **Settings → Billing:** GSTIN save works
- [ ] **GST invoice** appears under invoices; PDF downloads
- [ ] **Email:** invoice PDF + welcome email received (if Resend enabled)
- [ ] **Admin → Billing:** payment appears in recent payments
- [ ] **Admin → User detail:** plan + invoices list
- [ ] `GET /api/user/plan` → `isPaid: true`, correct `plan` / `billingInterval`

### E. Subscription lifecycle (Starter only)

- [ ] **Cancel:** Settings → cancel Starter → status `CANCELED`, access until period end
- [ ] **Webhook renewal:** Stripe/Razorpay test renewal → period extended + new invoice (or simulate `renewal_paid` in test dashboard)
- [ ] **Payment failed:** test `payment_failed` / `invoice.payment_failed` → user `PAST_DUE` + email (if Resend on)
- [ ] **Expiry:** Trigger `billing-lifecycle-dispatch` or wait for cron → lapsed Starter → `EXPIRED`, write lock, expiry email

### F. Freemium / limits

- [ ] New user → 7-day trial, usage meters visible
- [ ] After trial (or set `trialEndsAt` in DB for test) → writes locked, upgrade wall on 402
- [ ] Public **`/pricing`** and landing **#pricing** show correct INR amounts

### G. Mobile (staging)

- [ ] `EXPO_PUBLIC_API_URL` points at staging host
- [ ] Settings → **Billing** card loads plan + catalog prices (not hardcoded)
- [ ] Stripe checkout opens browser; Razorpay shows web fallback message
- [ ] 402 on create transaction opens upgrade sheet

---

## 5. Trigger.dev (production)

```bash
npm run trigger:deploy
```

Confirm in dashboard (IST):

| Task | Schedule |
|------|----------|
| `billing-lifecycle-dispatch` | 08:00 |
| `reminder-due-dispatch` | 07:00 |
| `purge-expired-receipt-shares` | 02:30 |
| `daily-health-check` | 06:00 |

- [ ] Prod env vars synced (`DATABASE_URL`, `ENABLE_RESEND`, `RESEND_API_KEY`, …)
- [ ] Manual test: run `billing-lifecycle-dispatch` once from dashboard → check logs

---

## 6. Analytics (optional but recommended)

- [ ] `NEXT_PUBLIC_GTM_ID` set; container published
- [ ] Replace `G-XXXXXXXXXX` in GTM import with real GA4 measurement ID
- [ ] GTM Preview: `ps_billing` fires on upgrade view / checkout start / success

---

## 7. Known limitations (not blocking launch)

| Item | Workaround |
|------|------------|
| No proration Starter → Pro | User pays full Pro; Starter sub canceled on upgrade |
| No monthly ↔ yearly self-serve switch | Cancel Starter, then buy other interval |
| Razorpay on mobile | Complete on web Settings |
| Mobile invoice PDF | Open web Settings to download |
| Pro vs Starter features | Same entitlements; Pro = lifetime + priority support (copy) |

---

## 8. Go / no-go

**Go** when all are true on staging:

- [ ] At least one full path: Freemium → Starter (or Pro) → invoice + email
- [ ] Webhooks deliver without signature errors
- [ ] Cancel + (optional) renewal/failure tested
- [ ] Admin billing overview shows revenue
- [ ] No secrets in client bundle (only `RAZORPAY_KEY_ID` / Stripe publishable patterns as designed)

Then promote the same env + webhook URLs to **production** and repeat section 4 with live keys only when ready.
