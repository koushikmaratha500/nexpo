# nexpo — Release 3.0: Implementation Guide

> Applies to AI SDK **v7** (`ai@^7`) + `@openrouter/ai-sdk-provider@^3` + Next.js 16 App Router. Node ≥22 (we run v24). Read `node_modules/next/dist/docs/` before touching route handlers in this codebase's Next version.

## 1. Dependencies

```bash
npm install ai @ai-sdk/react @openrouter/ai-sdk-provider
```

- `ai` — core (`streamText`, `generateObject`, `tool`, `convertToModelMessages`, types).
- `@ai-sdk/react` — `useChat` UI hook (ESM; works with React 19).
- `@openrouter/ai-sdk-provider` — `createOpenRouter`.

## 2. Environment

`.env` (already has Phase A keys — rename/extend):

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-...
# Optional overrides (defaults shown)
AI_MODEL=openrouter/free          # router: auto-picks free model w/ needed capability
AI_MODEL_OCR=google/gemma-4-26b-a4b-it:free
AI_MODEL_CHAT=openrouter/free
AI_MODEL_STRUCTURED=openrouter/free
AI_ENABLED=true                   # kill switch
```

Remove the old `AI_PROVIDER`/`AI_API_KEY` OpenAI-direct keys from `lib/ai/config.ts` (OpenRouter is the provider now). `AI_BASE_URL` no longer needed.

## 3. Replace hand-rolled clients with the AI SDK

**`lib/ai/config.ts`** — resolve per-feature model + enabled flag:

```ts
export type ModelKind = 'ocr' | 'chat' | 'structured';

const MODEL_MAP: Record<ModelKind, string> = {
  ocr: 'google/gemma-4-26b-a4b-it:free',
  chat: 'openrouter/free',
  structured: 'openrouter/free',
};

export function getAiConfig() {
  return {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    enabled: process.env.AI_ENABLED !== 'false',
    modelFor: (kind: ModelKind) => process.env[`AI_MODEL_${kind.toUpperCase()}`] || MODEL_MAP[kind],
  };
}

export function isAiConfigured(): boolean {
  return getAiConfig().enabled && getAiConfig().apiKey.length > 0;
}
```

**`lib/ai/provider.ts`** — replace the three raw-`fetch` classes with the SDK. Exposes `getOpenRouter`, `getModel(kind)` (first model in the list), `getModelList(kind)`, `withModelFallback(kind, fn)` and `withModelFallbackList(models, modelIds, kind, fn)`:

```ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import { getAiConfig, isAiConfigured, modelListFor, type ModelKind } from './config';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { isRetryableModelError } from './errors';

let openrouter: ReturnType<typeof createOpenRouter> | null = null;

export function getOpenRouter() {
  if (!isAiConfigured()) throw new HttpError(503, 'AI is not configured');
  openrouter ??= createOpenRouter({ apiKey: getAiConfig().apiKey });
  return openrouter;
}

export function getModel(kind: ModelKind): LanguageModel {
  return getModelList(kind)[0];
}

export function getModelList(kind: ModelKind): LanguageModel[] {
  return modelListFor(kind).map((id) => getOpenRouter()(id));
}

export function withModelFallback<T>(kind: ModelKind, fn: (model: LanguageModel) => Promise<T>): Promise<T> {
  const ids = modelListFor(kind);
  return withModelFallbackList(getModelList(kind), ids, kind, fn);
}

// withModelFallbackList: loop over models; on 429/5xx (isRetryableModelError) retry next, log the fallback, else rethrow.
```

**`lib/ai/config.ts`** — `modelListFor(kind)` returns the ordered fallback list (comma-separated `AI_MODEL_<KIND>` override, e.g. `AI_MODEL_OCR="google/gemma-4-26b-a4b-it:free,openrouter/free"`).

**`lib/ai/errors.ts`** — `providerStatus`, `isRetryableModelError`, `isProviderRateLimitError`, `toProviderHttpError` (maps provider 429→`HttpError(429)` and 5xx→`HttpError(503)`); used by every `/api/ai/*` catch before `handleApiError`.

Note: `openrouter('slug')` returns an AI SDK `LanguageModel`. For chat/completion-precise selection use `openrouter.chat('slug')` / `openrouter.completion('slug')` (optional).

## 4. Receipt OCR — migrate to `generateObject`

**`lib/ai/types.ts`** — keep `ReceiptExtractionSchema` (already zod, reusable by `generateObject`). Add a `receiptImage` helper for the vision content part:

```ts
export const ReceiptImageSchema = z.object({
  type: z.literal('image'),
  image: z.object({
    data: z.string(),            // base64
    mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  }),
});
```

**`lib/ai/agents/receipt.agent.ts`** (new — replaces `lib/ai/receipt.service.ts`):

```ts
import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/provider';
import { ReceiptExtractionSchema, type ReceiptExtraction } from '@/lib/ai/types';
import { HttpError } from '@/lib/api/middleware/errorHandler';

const categoryHint = (names: string[]) =>
  names.length
    ? `Choose category strictly from: ${names.join(', ')}. null if none fits.`
    : 'Suggest a plausible category name or null.';

export async function extractReceipt(opts: {
  imageBase64: string;
  mimeType: string;
  categoryNames?: string[];
}): Promise<ReceiptExtraction> {
  const { object } = await generateObject({
    model: getModel('ocr'),
    schema: ReceiptExtractionSchema,
    system:
      'You are a receipt OCR assistant. Return exact figures from the image. ' +
      'If a value is unreadable/missing, use null. Tax lines (GST/VAT) are not totals. ' +
      categoryHint(opts.categoryNames ?? []),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: { data: opts.imageBase64, mediaType: opts.mimeType as 'image/jpeg' },
          },
          { type: 'text', text: 'Extract the receipt fields.' },
        ],
      },
    ],
  });

  const parsed = ReceiptExtractionSchema.safeParse(object);
  if (!parsed.success) throw new HttpError(422, 'AI returned invalid receipt fields');
  return parsed.data;
}
```

> Why: `generateObject` guarantees the zod shape and auto-retries malformed output — removes the manual fence-stripping/`JSON.parse` in the old service.

**`app/api/ai/ocr/route.ts`** — unchanged contract (authGuard, mime/size checks, optional `categories`, returns `{ extraction }`). Swap the import from `receipt.service` to `receipt.agent`. Frontend ("Extract with AI" button + auto-fill) needs **no changes**.

## 5. Financial Copilot — tools + streaming chat

### 5.1 Tool registry — `lib/ai/tools/finance.tools.ts`

Tools go through the **existing layered stack** (services → repositories via `Container`), scoped to the authed `userId`. Example:

```ts
import { tool } from 'ai';
import { z } from 'zod';
import { Container } from '@/lib/api/shared/di/container';
import type { ITransactionRepository } from '@/lib/api/repositories/interfaces';
import type { IMetadataRepository } from '@/lib/api/repositories/interfaces';

const txnRepo = () => Container.resolve<ITransactionRepository>('ITransactionRepository');

export const financeTools = (userId: string) => ({
  readExpenses: tool({
    description: 'Read the user\'s expenses (DEBIT transactions) within a date range, optionally filtered by category.',
    parameters: z.object({
      from: z.string().describe('ISO date (YYYY-MM-DD). Inclusive.'),
      to: z.string().describe('ISO date (YYYY-MM-DD). Inclusive.'),
      category: z.string().optional().describe('Exact category name to filter, e.g. Food.'),
    }),
    execute: async ({ from, to, category }) => {
      const { items, total } = await txnRepo().findAll({
        userId,
        type: 'DEBIT',
        startDate: new Date(from),
        endDate: new Date(to),
        category,
      });
      return {
        total,
        items: items.map((t) => ({
          title: t.title, category: t.category, amount: t.amount,
          date: t.date, currency: t.currency, merchant: t.merchant,
        })),
      };
    },
  }),

  readIncome: tool({ /* … CREDIT equivalent … */ }),

  monthlySummary: tool({
    description: 'Get spending/income totals grouped by category for a month.',
    parameters: z.object({ month: z.string().describe('YYYY-MM') }),
    execute: async ({ month }) => {
      // Reuse the reports/dashboard aggregate logic from lib/api/services (categoryBreakdown),
      // NOT raw prisma here. Returns deterministic aggregates the model can reason over.
    },
  }),

  forecastCashflow: tool({
    description: 'Project next month\'s spend from the trailing N months\' averages.',
    parameters: z.object({ months: z.number().int().min(1).max(12).default(3) }),
    execute: async ({ months }) => { /* aggregate + simple avg; deterministic */ },
  }),

  getSavingsOpportunities: tool({
    description: 'Flag recurring subscriptions and budget-overrun categories.',
    parameters: z.object({}),
    execute: async () => { /* deterministic heuristics: recurring merchants, >limit categories */ },
  }),
});
```

Rules:
- Tool schemas are zod; `execute` returns plain JSON (amounts as numbers or strings — use `serializeAmount` style for currency-sensitive paths).
- `userId` is injected at call time, never derived from the prompt.
- Keep tools **read-only** in v3.0 (no create/update/delete via chat).

### 5.2 Chat route — `app/api/ai/chat/route.ts`

```ts
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { NextRequest } from 'next/server';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { getModel } from '@/lib/ai/provider';
import { financeTools } from '@/lib/ai/tools/finance.tools';
import { COPILOT_SYSTEM } from '@/lib/ai/agents/copilot.system';

export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: getModel('chat'),
      system: COPILOT_SYSTEM,               // tone + disclaimer ("not professional advice")
      messages: convertToModelMessages(messages),
      tools: financeTools(user.id),
      abortSignal: req.signal,               // cancel provider call on disconnect
      stopWhen: { minSoFar: 5000 },          // bound tool-loop turns/cost
    });

    // audit/cost logging via AiUsage repository helper (fire-and-forget after finish)
    result.onFinish?.(() => {});

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 5.3 Assistant UI — `components/features/assistant/`

```tsx
'use client';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export function AiAssistant() {
  const [input, setInput] = useState('');          // AI SDK 5+/7: YOU own input state
  const { messages, sendMessage, status } = useChat({ api: '/api/ai/chat' });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong>
          {m.parts.map((p, i) => (p.type === 'text' ? <span key={i}>{p.text}</span> : null))}
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage({ text: input }); setInput(''); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your spending…" />
        <button disabled={status !== 'ready'}>Send</button>
      </form>
    </div>
  );
}
```

- Barrel `index.ts`; page `app/customer/assistant/page.tsx` (client) — matches the feature-component pattern (typed props, own toasts).
- Render tool "facts" as small cards/chips (e.g. category deltas) by inspecting tool parts (`part.type === 'tool'`).

## 6. Proactive Insights

**`lib/ai/agents/insights.agent.ts`** — `generateObject` with a `WeeklyInsight` zod schema from computed aggregates (monthly totals, category deltas vs previous period, recurring merchants, budget-overrun estimates). Trigger on-demand when the dashboard loads (no cron infra in v3.0):

**`app/api/ai/insights/route.ts`** — `authGuard`, run agent, return `{ insights: [...] }`; cache per-user for the day (Upstash KV) to respect free-tier limits.

**UI** — `InsightCard.tsx` on the customer dashboard; `AiUsage`-logged.

## 7. AiUsage audit + rate limiting

- **Prisma**: add `AiUsage` model (§8 of architecture.md), `prisma db push`.
- **Repository**: `AiUsageRepository` (or helper on existing user repo pattern) with `create`/`recentByUser`.
- **Rate limit**: wrap `/api/ai/*` with Upstash `ratelimit` (e.g. 20 calls/day/user for chat, 50 for OCR). Return `429`.

## 8. Health endpoint

`app/api/ai/health/route.ts` — `GET` (auth): returns `{ enabled, provider: 'openrouter', models: { ocr, chat, structured } }` (no key material).

## 9. Verification checklist

1. `npx tsc --noEmit` clean; ESLint clean (no `any`; `import type` from `lib/ai` on client).
2. OCR: upload a sample receipt image → fields auto-fill; bad image → 415; >10 MB → 413; no key → 503.
3. Chat: ask "How much did I spend on Food last month?" → tool call visible → streamed answer with real numbers.
4. Disconnect mid-stream → provider call aborted (check OpenRouter dashboard activity stops).
5. Rate limit exceeded → 429 surfaced as toast.
6. `AiUsage` rows written per call with correct tokens/latency.
