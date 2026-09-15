# Nexpo Mobile (Expo)

React Native client mirroring the **customer web portal**. Uses the same HTTP APIs via `@nexpo/shared`. Git-tracked; excluded from Vercel via root `.vercelignore`.

## Customer screens (parity with web)

| Tab / Screen | Web route | Mobile route |
|--------------|-----------|--------------|
| Dashboard | `/customer` | Home tab |
| Transactions | `/customer/transactions` | Transactions tab |
| Groups | `/customer/groups` | Groups tab |
| Group detail | `/customer/groups/[id]` | Stack → tabs: Transactions, Balances, Members, Reminders |
| Reminders | `/customer/reminders` | Reminders tab |
| Notifications | `/customer/notifications` | 🔔 header / More |
| Reports | `/customer/reports` | More → Reports |
| AI Assistant | `/customer/assistant` | More → AI Assistant |
| Settings | `/customer/settings` | More → Settings |
| Help Center | `/customer/support` | More → Help Center |

## Setup

```bash
npm install
cp mobile/.env.example mobile/.env
npm run dev          # Next.js API in another terminal
npm run mobile:android   # or: cd mobile && npm run android
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_API_URL` | **Yes** | Base URL for all API calls via `@nexpo/shared` |
| `EXPO_PUBLIC_SUPABASE_URL` | No | Google OAuth only |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Google OAuth only |

**API URL by target:**

| Target | `EXPO_PUBLIC_API_URL` |
|--------|------------------------|
| Android emulator | `http://10.0.2.2:3000` |
| iOS simulator | `http://localhost:3000` |
| Physical device (same Wi‑Fi) | `http://<LAN-IP>:3000` — run API with `next dev -H 0.0.0.0` |
| Staging / production | `https://your-domain.com` (HTTPS required for release APK/AAB) |

For Google login, add `paysasuchan://auth/callback` to Supabase redirect URLs.

### Android pre-flight (local)

- [ ] `mobile/.env` exists with `EXPO_PUBLIC_API_URL`
- [ ] Next.js dev server running
- [ ] Android emulator or device with Expo Go / dev client

### EAS / Play Store (before cloud build)

- [ ] `eas login` + `eas init` in `mobile/` (replaces placeholder `projectId` in `app.json`)
- [ ] EAS secrets: `EXPO_PUBLIC_API_URL`, Supabase vars (if using Google login)
- [ ] `google-play-service-account.json` for `eas submit` (gitignored)
- [ ] Preview APK smoke test: login, transactions, settings, billing sheet

## Architecture

```
mobile/app/           Expo Router screens
mobile/src/           UI components, stores, auth
packages/shared/      API client, types, SplitService, date utils
```

Server code (`lib/api/`, Prisma) stays on Next.js — never bundled in the app.

## Not in v1 mobile

- CSV import modal (web only)
- Receipt OCR on add form (web only)
- OneSignal web push (use notification prefs; native push via EAS later)
- Auth register / forgot-password flows (login only; use web for signup)

## Store builds

Use [EAS Build](https://docs.expo.dev/build/introduction/) from `mobile/`.
