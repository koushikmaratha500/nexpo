# Release 5.0 — W4 Test Release Checklist

Use before submitting **TestFlight** / **Play Internal** builds and after staging deploy.

## Automated gate

```bash
npm run lint
npm run test:all
npm run mobile:typecheck
JWT_SECRET=test npm run build
```

## Supabase Google OAuth (web + mobile)

- [ ] **Web:** `/auth/login` → Continue with Google → lands on `/customer`
- [ ] **Mobile:** Login → Continue with Google → lands on dashboard tabs
- [ ] Supabase redirect URLs include:
  - `http://localhost:3000/auth/callback` (dev web)
  - `https://<prod-domain>/auth/callback` (prod web)
  - `paysasuchan://auth/callback` (mobile deep link)
- [ ] `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set in EAS secrets for mobile builds

## Share receipt (W2–W3)

- [ ] Create share link from personal transaction (web + mobile)
- [ ] Create share link from group transaction (web + mobile)
- [ ] Public `/r/{token}` loads without auth
- [ ] WhatsApp / copy link works
- [ ] Revoke share removes public access
- [ ] Expired share returns 404 / gone message
- [ ] `NEXT_PUBLIC_APP_URL` correct in production (share URLs)

## Convert transaction (W3)

- [ ] Personal → group (equal split) on web + mobile
- [ ] Group → personal (creator or admin) on web + mobile
- [ ] Recurring transaction blocked with clear error
- [ ] Group balances update correctly after convert

## Mobile core flows

- [ ] Email login / logout / session restore (SecureStore token)
- [ ] Dashboard loads
- [ ] Personal transactions list + create
- [ ] Receipt attach / document picker
- [ ] Groups list + detail + add expense
- [ ] Balances tab reasonable
- [ ] Reminders list
- [ ] Notifications list
- [ ] API unreachable shows toast (airplane mode smoke)

## EAS build & distribute

```bash
cd mobile
eas login
eas init                    # once — updates app.json extra.eas.projectId
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://<api-host>
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value <url>
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value <key>
npm run build:preview       # from repo root
```

- [ ] iOS preview build installs on physical device (TestFlight or ad hoc)
- [ ] Android preview APK/AAB installs on physical device
- [ ] App icon + splash show PaysaSuchan violet branding
- [ ] `EXPO_PUBLIC_API_URL` points to staging or prod consistently

## Trigger.dev

- [ ] `npm run trigger:deploy` — includes `purge-expired-receipt-shares` daily schedule

## Sign-off

| Role | Name | Date |
|------|------|------|
| Dev | | |
| QA | | |
| Product | | |
