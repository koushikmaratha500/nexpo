<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:layered-architecture -->
# API Architecture (Layered)

Server code follows a strict layered pattern under `lib/api/`. Never access `prisma` directly from controllers or route handlers; go through the layers.

## Layers
- **`lib/api/controllers/`** — HTTP layer: parse/validate input via DTO middleware, call a service, serialize responses. Use helpers from `base.controller.ts` (`success`, `error`, `safeExecute`).
- **`lib/api/services/`** — Business logic & orchestration. One service per domain (e.g. `admin.service.ts`, `transaction.service.ts`). Services depend on repositories, not on `prisma`.
- **`lib/api/repositories/`** — Data access. The ONLY layer allowed to import `prisma`. Per-domain repositories + shared `base.repository.ts` and `interfaces/`.
- **`lib/api/dtos/`** — Zod schemas + inferred DTO types (e.g. `admin.dto.ts` exports `CreateUserDto`, `UpdateUserDto`, ...). Controllers parse DTOs inline with Zod (`schema.parse(body)` / `schema.parse(searchParams)`).
- **`lib/api/domain/`** — Domain types/models.

## Conventions
- Controllers must not import `prisma`; repositories must not import controllers/services.
- Controllers extend `BaseController` and use `safeExecuteJson()` + exported `getZodMessage` / `getErrorMessage` for consistent `{ error }` responses.
- Services/repositories use static class methods (no DI container).
- Auth/OTP: `otp.service.ts` owns OTP lifecycle (in-memory Map, 15min TTL, max 5 attempts) — no hardcoded codes.
- Amounts are serialized to strings via repository helpers (e.g. `TransactionRepository.serializeItems`/`serializeAmount`) to avoid Decimal precision issues.
- Audit writes go through repository helpers (`UserRepository.createAudit`, `TransactionRepository.createAudit`), never `prisma.<x>Audit.create` in services.
- Use `getErrorMessage`/`getZodMessage` (from `base.controller.ts`) for consistent error handling in controllers.
- Prefer typed repository method signatures over `any`; use `str()`/typed accessors instead of unchecked property access.

# Frontend Feature Pattern

Reusable UI lives in `components/features/<domain>/` with a barrel `index.ts`; data access lives in `hooks/` and Zustand stores under `store/`. Pages wire them together.
- Customer transaction/dashboard pages use `useTransactionStore` against `/api/user/transactions` and `/api/user/transaction*`.
- Shared API helpers: `hooks/useApi.ts` (`apiGet`/`apiPost`/`apiPatch`/`apiDelete`).
- Feature components take typed props (e.g. `RecentTransactionsProps`, `DocumentUploaderProps`) and own their UI + toast feedback.
- `useToast` API: `addToast(message: string, type?: 'success' | 'error' | 'warning' | 'info')`.
- `Button` has no `loading` prop; `TablePagination` uses `itemsPerPage` (not `pageSize`).
- Avoid `any` — type react-hook-form usage with `UseFormRegister`/`UseFormWatch`/`FieldError`/`UseFormRegisterReturn`.

# AI Layer (`lib/ai/`)

Server-only AI helpers (Release 3.0) built on the **Vercel AI SDK v7** + **OpenRouter** (`@openrouter/ai-sdk-provider`). Never import `lib/ai/` from client components except `import type` (types only — `types.ts` re-exports zod schemas).
- `config.ts` reads `OPENROUTER_API_KEY`, `AI_ENABLED`, and `AI_MODEL_<KIND>` overrides; `modelFor(kind)` resolves per-feature models (ocr/chat/structured). Defaults: ocr=`google/gemma-4-26b-a4b-it:free`, chat/structured=`openrouter/free`.
- `provider.ts` — `createOpenRouter` singleton + `getModel(kind)` returning an AI SDK `LanguageModel`; throws `HttpError(503)` when unconfigured.
- `agents/receipt.agent.ts` — image → structured extraction via `generateObject` + `ReceiptExtractionSchema` (auto-retry, zod-validated).
- Routes live under `app/api/ai/...`, always `authGuard` + `handleApiError`. Keep keys server-side; scope tools/data per authenticated user.
<!-- END:layered-architecture -->
