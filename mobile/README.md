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
cp mobile/.env.example mobile/.env    # or: npm run mobile:sync-env
npm run dev          # Next.js API in another terminal
npm run mobile:android   # or: cd mobile && npm run android
```

**Monorepo:** run Expo via `npm run start` / `npm run start:clear` from `mobile/` (or `npm run expo -- start --clear`). Do **not** use raw `npx expo start` — the hoisted CLI at the repo root cannot resolve `expo-router` from `mobile/node_modules`.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_API_URL` | **Yes** | Base URL for all API calls via `@nexpo/shared` |
| `EXPO_PUBLIC_SUPABASE_URL` | For Google | Same as web `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | For Google | Same as web `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

**Quick setup from web env:**

```bash
npm run mobile:sync-env   # copies NEXT_PUBLIC_* from root .env.local → mobile/.env
```

**API URL by target:**

| Target | `EXPO_PUBLIC_API_URL` |
|--------|------------------------|
| Android emulator | `http://10.0.2.2:3000` |
| iOS simulator | `http://localhost:3000` |
| Physical device (same Wi‑Fi) | `http://<LAN-IP>:3000` — run API with `next dev -H 0.0.0.0` |
| Staging / production | `https://your-domain.com` (HTTPS required for release APK/AAB) |

In **development**, if `EXPO_PUBLIC_API_URL` is unset, the app falls back to `10.0.2.2:3000` (Android) or `localhost:3000` (iOS).

### Google sign-in (Supabase)

Mobile uses the **same flow as web**: Supabase Google OAuth → app exchanges Supabase access token for Nexpo JWT via `POST /api/user/auth/google`.

#### 1. Supabase Dashboard

**Authentication → Providers → Google**

- Enable Google provider
- Add **Google Cloud OAuth 2.0 Client ID** and **Client secret** (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
- Authorized redirect URIs in Google Cloud must include your Supabase callback:
  `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`

**Authentication → URL Configuration → Redirect URLs**

Mobile uses an **HTTPS callback on your API** (not `exp://`), so the in-app browser can return to the app reliably:

| Environment | Redirect URL |
|-------------|----------------|
| Android emulator | `http://10.0.2.2:3000/auth/mobile-callback` |
| iOS simulator | `http://localhost:3000/auth/mobile-callback` |
| Physical device (LAN) | `http://<LAN-IP>:3000/auth/mobile-callback` |
| Production | `https://your-domain.com/auth/mobile-callback` |
| Web (unchanged) | `http://localhost:3000/auth/callback` and `https://your-domain.com/auth/callback` |

> **Tip:** In dev, the mobile login screen prints the exact `EXPO_PUBLIC_API_URL/auth/mobile-callback` to add. It must match your API URL (emulator vs LAN IP vs production).

#### 2. Mobile `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...   # anon / publishable key (not service role)
```

Use the **same** Supabase project and publishable key as the web app (`NEXT_PUBLIC_SUPABASE_*` in root `.env.local`).

#### 3. Google Cloud Console

Create an OAuth 2.0 **Web application** client (used by Supabase):

- **Authorized JavaScript origins:** your web app origin(s)
- **Authorized redirect URIs:** `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`

No separate Android/iOS OAuth client is required for this Supabase-based flow.

### Android pre-flight (local)

- [ ] `mobile/.env` exists with `EXPO_PUBLIC_API_URL`
- [ ] Next.js dev server running
- [ ] Android emulator or device with Expo Go / dev client
- [ ] Supabase redirect URLs include your mobile callback URI

### EAS / Play Store (before cloud build)

- [ ] `eas login` + `eas init` in `mobile/` (replaces placeholder `projectId` in `app.json`)
- [ ] EAS secrets: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `google-play-service-account.json` for `eas submit` (gitignored)
- [ ] Preview APK smoke test: email login, Google login, transactions, settings

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
