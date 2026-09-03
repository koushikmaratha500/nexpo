# Release 5.0 — Production Deploy Checklist

Use for **Vercel web go-live** and **production EAS** builds.

## Pre-deploy

- [ ] `npx prisma db push` applied on production database
- [ ] `TransactionShare` table exists
- [ ] Staging passed `release5.0/w4-test-release-checklist.md`
- [ ] `npm run test:all` green on release branch

## Vercel environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Supabase Postgres pooler URL |
| `JWT_SECRET` | Yes | Strong random string |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://your-domain.com` — share links + emails |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server uploads only |
| `SUPABASE_UPLOAD_BUCKET` | Yes | Default `nexpo` |
| `ENABLE_RESEND` | Yes | `true` in prod |
| `RESEND_API_KEY` | If Resend | |
| `RESEND_FROM_EMAIL` | If Resend | Verified sender |
| `REMINDER_DISPATCH_SECRET` | Yes | Cron / internal dispatch |
| `OPENROUTER_API_KEY` | If AI | |
| `AI_ENABLED` | Optional | `true` / `false` |
| `ONESIGNAL_APP_ID` | If push | |
| `ONESIGNAL_REST_API_KEY` | If push | |
| `UPSTASH_REDIS_REST_URL` | If rate limits | Or Vercel KV vars |
| `UPSTASH_REDIS_REST_TOKEN` | If rate limits | |
| `TRIGGER_SECRET_KEY` | If Trigger | Background jobs |
| `NEXT_PUBLIC_BRAND_LOGO_URL` | Optional | Swap logo without redeploy |

**Do not set in production:**

- `ALLOW_DEV_OTP_IN_PRODUCTION`
- `EXPOSE_DEV_RESET_TOKEN`
- `DEV_OTP_CODE` (unless emergency — blocked by AP-0 guard)

## Supabase Auth (Google)

1. Enable Google provider with OAuth client ID/secret
2. Redirect URLs:
   - `https://<prod-domain>/auth/callback`
   - `paysasuchan://auth/callback` (mobile)

## Deploy web

```bash
git push origin main   # or merge PR — Vercel auto-deploy
```

Post-deploy smoke:

- [ ] `/` landing loads with PaysaSuchan branding
- [ ] `/auth/login` email + Google sign-in
- [ ] Create transaction → share link → open `/r/{token}` in incognito
- [ ] Convert personal ↔ group transaction
- [ ] Admin login still works at `/admin`

## Production mobile build

```bash
cd mobile
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://<prod-domain>
eas build --profile production --platform all
eas submit --profile production --platform ios    # TestFlight
eas submit --profile production --platform android # Play internal
```

Update `eas.json` submit block with real Apple / Play credentials before submit.

## Trigger.dev production

```bash
npm run trigger:deploy
```

Verify scheduled task `purge-expired-receipt-shares` appears in Trigger dashboard.

## Monitoring (soft launch week)

- [ ] Vercel function logs — no spike in 5xx on `/api/public/receipts/*`
- [ ] Supabase Auth logs — Google OAuth success rate
- [ ] Error tracking (if configured) — zero P0 for 24h

## Rollback

- Vercel: redeploy previous production deployment
- Mobile: previous TestFlight / internal track build remains installable
- Database: convert/share are additive — rollback is code-only unless bad migration

## Go / no-go (from delivery plan)

### Web

- [ ] Landing + violet theme live
- [ ] Share + convert in prod
- [ ] Google sign-in on Login + Register
- [ ] AP-0 complete
- [ ] `npm run test:all` green

### Mobile test release

- [ ] EAS builds install on iOS + Android
- [ ] Core flows pass smoke test
- [ ] Internal testers onboarded (5–10)
