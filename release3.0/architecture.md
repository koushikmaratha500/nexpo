# nexpo — Release 3.0: AI Architecture

> Status: Planning · Owner: @koushikmaratha · Target: AI Financial Copilot (not a chatbot)

## 1. Vision

nexpo stops being a data-entry ledger and becomes an **AI Financial Copilot**. Users never have to "know" AI exists — the app proactively says:

- "You spent 37% more on dining this week."
- "At this pace you'll exceed your monthly budget by ₹6,200."
- "You have 3 subscriptions you haven't used recently."
- And when they upload a receipt, the form fills itself.

The AI never reads or writes the database directly. It reasons over **tool results** (structured, user-scoped aggregates) and **structured model output** (OCR fields, insights JSON). Financial numbers stay deterministic; the LLM only does OCR, intent parsing, and narration.

## 2. Goals / Non-goals

**Goals**
- One AI SDK integration path (Vercel AI SDK) with OpenRouter as the provider — swap models by config, not code.
- Zero-cost development: `openrouter/free` router + `:free` variants.
- Receipt OCR with auto-fill (Phase A, migrated to AI SDK structured output).
- User-scoped, tool-calling Financial Copilot chat with streaming.
- Proactive weekly insights + budget-overrun prediction.
- Cost, rate-limit and audit governance from day one.

**Non-goals (v3.0)**
- RAG / vector DB over receipts (OCR text is enough; data lives in Postgres).
- Multi-tenant cross-user analytics.
- Investments/portfolio APIs (only "savings opportunity" suggestions from existing data).
- Replacing the existing layered API (`lib/api/`); AI consumes it.

## 3. Stack & Key Decisions

| Concern | Choice |
|---|---|
| SDK | Vercel AI SDK **v7** (`ai@^7`) + `@ai-sdk/react` (UI hooks) |
| Provider | `@openrouter/ai-sdk-provider` **v3** (`createOpenRouter`) — ESM-only, Node ≥22 (we run v24) |
| Default model | `openrouter/free` (Free Models Router — auto-filters free models by required capability: vision / tools / structured output) |
| Per-feature models | Config map, override per call (see §5) |
| Structured output | `generateObject` + Zod schemas (auto-retry on invalid structure) |
| Streaming | `streamText` + `useChat`, `toUIMessageStreamResponse`, `convertToModelMessages` |
| Data access | AI tools call existing services/repositories via the DI container — never `prisma` in `lib/ai/` |
| Rate limit | Existing Upstash ratelimit (already a dependency) |
| Audit | Extend existing repository audit helper pattern (`UserRepository.createAudit`) |
| Keys | Server-side only; `NEXT_PUBLIC_*` never touches AI keys |

## 4. Architecture

```
                        ┌──────────────────────────────────────────┐
                        │           Client (React 19)              │
                        │  useChat  ·  ReceiptForm ·  InsightCard  │
                        └───────┬────────────────┬────────────────┘
                                │ fetch/SSE      │ FormData
                    ┌───────────▼────────────┐   ┌▼────────────────────┐
                    │ /api/ai/chat           │   │ /api/ai/ocr         │
                    │ /api/ai/insights       │   │ (exists from Phase A)│
                    └───────────┬────────────┘   └─────────┬──────────┘
                                │        authGuard (CUSTOMER) · rate-limit · audit
                     ┌──────────▼──────────────────────────▼───────────┐
                     │                  lib/ai/ (server-only)          │
                     │                                                  │
                     │  config.ts   → model map + OpenRouter key        │
                     │  provider.ts → createOpenRouter singleton        │
                     │  agents/     → receiptAgent, copilotAgent,       │
                     │                insightsAgent (generateObject)    │
                     │  tools/      → finance.tools.ts (typed tool defs)│
                     │  types.ts    → zod schemas (ReceiptExtraction…)   │
                     └───────┬────────────────────────────────┬─────────┘
                             │ tool.execute()                 │ generateObject
                     ┌───────▼──────────────────────────────┐ ┌▼──────────────────┐
                     │ lib/api/ services → repositories     │ │ OpenRouter API    │
                     │ (TransactionRepository.findAll…,     │ │ (free router)     │
                     │  reports/dashboard aggregates)       │ │ OpenAI-compatible │
                     └──────────────────────────────────────┘ └───────────────────┘
```

### 4.1 Component map (target state)

```
lib/ai/
  config.ts        env + per-feature model resolution
  provider.ts      getModel(kind) → openrouter(modelId)   [replaces hand-rolled fetch clients]
  types.ts         zod schemas: ReceiptExtraction, CopilotInsight, WeeklyInsight
  agents/
    receipt.agent.ts     OCR extraction (generateObject + vision)
    copilot.agent.ts     system prompt + tool wiring (streamText)
    insights.agent.ts    weekly/proactive insight generation
  tools/
    finance.tools.ts     readExpenses/readIncome/monthlySummary/forecastCashflow/…
app/api/ai/
  ocr/route.ts      exists → migrate internals to AI SDK (keep API/UI contract)
  chat/route.ts     new → streamText + tools
  insights/route.ts new → generateObject summaries, user-scoped
  health/route.ts   new → liveness + configured model list
components/features/assistant/
  AiAssistant.tsx  useChat UI  ·  InsightCard.tsx  ·  index.ts (barrel)
app/customer/assistant/page.tsx   (new)
```

### 4.2 Data flow — chat turn

1. `useChat` POSTs `UIMessage[]` to `/api/ai/chat`.
2. Route runs `authGuard(req, 'CUSTOMER')` → `userId`.
3. `streamText({ model, messages: convertToModelMessages(msgs), tools, system, abortSignal: req.signal, stopWhen })`.
4. Model emits tool calls; the SDK executes `tool.execute` which calls `TransactionRepository.findAll({ userId, ... })` (scoped) and returns aggregates as JSON.
5. Final answer streams back via `toUIMessageStreamResponse()`.
6. On finish → write audit + cost row (see §7).

### 4.3 Data flow — receipt OCR

1. Form posts image (JPG/PNG/WEBP ≤10 MB) to `/api/ai/ocr`.
2. `authGuard`, type/size checks, optional `categories[]` seed.
3. `receipt.agent` calls `generateObject({ model: visionModel, schema: ReceiptExtractionSchema, ...image content part })`.
4. Route returns `{ extraction }`; client auto-fills the add-transaction form (existing Phase A UI).

## 5. Model Strategy

```ts
// lib/ai/config.ts (concept)
MODEL_MAP = {
  default: env('AI_MODEL', 'openrouter/free'),
  ocr:     env('AI_MODEL_OCR', 'google/gemma-4-26b-a4b-it:free'),  // vision-capable free
  chat:    env('AI_MODEL_CHAT', 'openrouter/free'),
  insight: env('AI_MODEL_STRUCTURED', 'openrouter/free'),
}
```

- **`openrouter/free`** — router; picks a free model that supports the required capability (vision/tools/structured output) and routes accordingly. Best default; model choice is randomized.
- **`model:free`** — pin a specific free model when you need determinism (e.g. a known OCR-capable model) or consistency of behavior.
- **Fallback chain** — each feature resolves an **ordered model list** (`modelListFor(kind)` in `lib/ai/config.ts`; comma-separated `AI_MODEL_<KIND>` overrides). `withModelFallback` (`lib/ai/provider.ts`) retries the next model on `429`/`5xx` (classification in `lib/ai/errors.ts`) and logs the fallback. Wired into OCR (`receipt.agent.ts`) and insights (`insights.agent.ts`). Chat relies on the `openrouter/free` router (inherent model pool) + SDK `maxRetries` — cross-model fallback is impractical mid-stream.
- **Error mapping** — `toProviderHttpError` (`lib/ai/errors.ts`) maps provider `429`→`429` and provider `5xx`→`503` before `handleApiError` in every `/api/ai/*` route; OCR adds `422` for malformed hint lists, `400/415/413` for upload problems; chat returns `400` for malformed JSON bodies.
- **Env contract** — `OPENROUTER_API_KEY` is the only required secret. `AI_MODEL*` are overrides.
- Free-tier note: rate limits are per-account and scale with credit purchase; the router counts toward the same cap as `:free`. Our Upstash per-user limit keeps one user from exhausting the account.

## 6. Governance & Security

1. **Server-only** — `lib/ai/` never imported from client components except `import type` (types carry the zod schemas; value imports would ship them).
2. **Auth every route** — `authGuard` on `/api/ai/*`; `userId` threaded through tool execution (never from prompt).
3. **Deterministic money** — amounts come from repository results serialized as strings (existing `serializeAmount` helper); LLM only narrates. Never let a model return a number that changes a stored amount.
4. **Audit & cost** — new `AiUsage` table (see §8) written via repository helper after each call: `userId, feature, model, inputTokens, outputTokens, latencyMs, status`. Zero-token (rejected/failed) calls still logged.
5. **Rate limits** — Upstash per-user, per-feature buckets; reject with `429` before any provider call.
6. **Disclaimers** — Tax/finance advice responses end with "not professional advice" (system-prompt enforced).
7. **Kill switch** — `AI_ENABLED=false` short-circuits all routes to `503` for instant disable.
8. **Prompt-injection** — system prompts treat all user input as DATA, never instructions (`COPILOT_SYSTEM` explicit guard); the OCR/insights agents use fixed system text with no user-free-text fields.
9. **`AiUsage` PII-free** — logs `userId, feature, model, tokens, latency, status, error(≤500 chars)`; never transaction data, images, or chat content.
10. **Tests** — `npm test` (Vitest, `release3.0/tests/`): aggregate correctness, error classification, fallback retry, rate-limit memory store, provider 503, OCR route validation + error mapping (auth/rate-limit/agent mocked; no network/DB).

## 7. Streaming & Tool Best Practices

- Always pass `abortSignal: req.signal` → real cancellation on client disconnect (stops token burn).
- Tool loops bounded: `stopWhen` (max turns) — never an uncapped agent loop on free tier.
- `generateObject` for anything that must be structured (OCR, insights); it auto-retries malformed output.
- `useChat` (AI SDK 5+/7) — the app owns input state (`useState`); messages are `parts[]`, not a `content` string. Migration gotcha: do not copy v4-era `useChat` examples.

## 8. Data Model Additions

```prisma
model AiUsage {
  id          String   @id @default(cuid())
  userId      String
  feature     String   // 'ocr' | 'chat' | 'insights'
  model       String
  inputTokens Int      @default(0)
  outputTokens Int     @default(0)
  latencyMs   Int
  status      String   // 'OK' | 'ERROR' | 'RATE_LIMITED'
  error       String?
  createdAt   DateTime @default(now())
  @@index([userId, createdAt])
}
```

- Optional (v3.1): `AiInsight` to persist weekly insights for history/render-on-demand.
- Chat history: client-side via `useChat` persistence (e.g. `@ai-sdk/react` storage or localStorage) — no DB table needed for v3.0.

## 9. Ops & Rollout

1. `.env`: set `OPENROUTER_API_KEY`; keep `AI_MODEL=openrouter/free` defaults.
2. Deploy: no new infra (no queue/DB changes required for v3.0). Cron (if used) via Vercel Cron — default is on-demand generation to keep it simple.
3. Observability: `AiUsage` table is the cost/health dashboard; `/api/ai/health` for liveness.
4. Rollout order: **Foundation → OCR migration → Copilot chat → Insights** (see tasks.md).
