import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError, HttpError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit } from '@/lib/api/middleware/rateLimiter';
import { AiUsageRepository } from '@/lib/api/repositories/aiUsage.repository';
import { getAiConfig } from '@/lib/ai/config';
import { generateInsights } from '@/lib/ai/agents/insights.agent';
import { toProviderHttpError, unwrapProviderError } from '@/lib/ai/errors';

const INSIGHTS_DAILY_LIMIT = 5;
const INSIGHTS_WINDOW_SECONDS = 24 * 60 * 60;
const CACHE_TTL_SECONDS = 26 * 60 * 60;

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  let userId: string | undefined;

  try {
    const user = await authGuard(req, 'CUSTOMER');
    userId = user.id;

    const todayKey = new Date().toISOString().slice(0, 10);
    const cacheKey = `ai_insights:${user.id}:${todayKey}`;

    // Cache-first: a repeat hit within the same day returns without a provider call or re-bill.
    try {
      const cached = (await kv.get(cacheKey)) as { insights: unknown[]; generatedFor: string } | null;
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch {
      // Cache unavailable — fall through to generation.
    }

    await checkRateLimit(req, `ai_insights:${user.id}`, {
      limit: INSIGHTS_DAILY_LIMIT,
      windowSeconds: INSIGHTS_WINDOW_SECONDS,
    });

    const { insights, inputTokens, outputTokens } = await generateInsights({ userId });

    const payload = { insights, generatedFor: todayKey };
    try {
      await kv.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS });
    } catch {
      // Cache unavailable — the response still stands.
    }

    await AiUsageRepository.create({
      userId: user.id,
      feature: 'insights',
      model: getAiConfig().modelFor('structured'),
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startedAt,
      status: 'OK',
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (userId && !(error instanceof HttpError && error.status === 429)) {
      await AiUsageRepository.create({
        userId,
        feature: 'insights',
        model: getAiConfig().modelFor('structured'),
        latencyMs: Date.now() - startedAt,
        status: 'ERROR',
        error: unwrapProviderError(error).message.slice(0, 500),
      }).catch(() => {
        // Audit logging must never mask the original error.
      });
    }
    return handleApiError(toProviderHttpError(error) ?? unwrapProviderError(error));
  }
}
