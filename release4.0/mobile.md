# Release 4.0 — Customer Portal Mobile App (React Native)

## Context / Good News

The customer portal is already mobile-friendly architecturally:
- Clean REST API layer under `app/api/*` — reusable by React Native as-is.
- **Bearer JWT auth** (`authGuard` in `lib/api/middleware/authGuard.ts` reads the `Authorization` header, no cookies) — no CSRF/cookie bridging needed.
- Client data access is plain axios (`hooks/useApi.ts` + interceptor) — directly portable.

Challenges are concentrated on the client side, not the backend.

## Architecture / Code Sharing
1. **No code-sharing story today** — it's a single Next.js project. React Native cannot import web components/hooks. Decision needed: monorepo (Turborepo) with shared `types`, `zod` DTO schemas, and an API client package, vs. duplicating in a second app.
2. **`hooks/useApi.ts` (axios) can be ported** — same pattern, but needs base-URL config, HTTPS/SSL (iOS ATS blocks `http://`), and per-environment URLs (`localhost` fails on physical devices).
3. **Two frontends to maintain** — every shipped feature (assistant, OCR, insights) ships twice unless shared packages are introduced.

## Auth & Security (financial app)
4. **Token storage** — web keeps JWT in a zustand store; RN must use **Keychain/SecureStore** (not AsyncStorage), ideally with biometric unlock.
5. **401/session handling** — need refresh/expiry + auto-logout interceptor. Today there is only login/reset (no token refresh) — a server-side gap to fill.
6. **Deep linking** — password-reset links are web routes (`/admin/reset-password?token=...`); mobile needs universal links/branch handling.
7. **Device security** — jailbroken/rooted-device detection, screen-capture blocking on transaction screens (banking-grade expectations).

## AI Feature Porting (differentiators)
8. **Streaming chat** — `useChat` + `DefaultChatTransport` (`components/features/assistant/AiAssistant.tsx`) is web-oriented; RN fetch/streaming is patchy. Switch to `@ai-sdk/react-native` or a custom stream reader; re-render markdown/tables natively.
9. **OCR receipt capture** — camera/gallery (`expo-image-picker`), image compression before the 10 MB limit (`app/api/ai/ocr/route.ts`), multipart parity with `app/api/upload`.
10. **InsightCard / dashboard** — AI insights component + graceful error-hiding behavior must be rebuilt natively.

## UI / UX Rebuild
11. **Full UI rewrite** — 8 screens (dashboard, transactions, expenses, credit, reports, settings, support, assistant) are Tailwind/shadcn components; nothing transfers to RN. Design system (theme tokens, tables→lists, forms, toasts) must be rebuilt.
12. **Tables don't work on mobile** — transactions/reports tables become `FlatList`/`SectionList` with virtualization for large datasets.
13. **Charts** — reports page uses a web chart lib; RN needs `react-native-svg`/victory-native re-implementation.

## Device & Ops
14. **Push notifications** — none exists today (no FCM/APNs infra, no server sender). Needed for bill reminders, fraud alerts, and the AI digest to be useful on mobile.
15. **Offline support** — RN users expect it; requires a local DB (SQLite/MMKV) + sync queue. API is online-only today — significant effort.
16. **Build/release pipeline** — App Store/Play Store signing, EAS builds, CI — a new surface vs. Vercel deploys. **Expo (managed workflow) is the pragmatic choice** to avoid native toolchains.
17. **Testing** — separate RN testing (Jest + RNTL) alongside the existing Vitest suite.

## Recommended Approach
- Use **Expo** (managed workflow) + a shared **types/API/zod** package to maintain parity with web.
- Ship read-only + auth screens first (dashboard, transactions, reports), then the AI features (assistant streaming, OCR) — the differentiators.
- Budget explicitly for **push notifications** and **token refresh** — both are current server-side gaps.

## Open Decisions
- Monorepo structure (Turborepo vs. two standalone repos with a shared package).
- Expo vs. bare React Native.
- Shared package scope (types + zod schemas + API client only, vs. also shared validation/form logic).
- Server-side additions required: token refresh endpoint, push-notification sender, potential offline-sync endpoints.
