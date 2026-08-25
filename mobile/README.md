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
# EXPO_PUBLIC_API_URL=http://localhost:3000  (iOS sim)
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000   (Android emu)
npm run dev          # Next.js API in another terminal
npm run mobile
```

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
