import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit } from '@/lib/api/middleware/rateLimiter';
import { AiUsageRepository } from '@/lib/api/repositories/aiUsage.repository';
import { getAiConfig } from '@/lib/ai/config';
import { generateInsights } from '@/lib/ai/agents/insights.agent';
import { toProviderHttpError, unwrapProviderError } from '@/lib/ai/errors';

const INSIGHTS_DAILY_LIMIT = 5;
const INSIGHTS_WINDOW_SECONDS = 24 * 60 * 60;
const CACHE_TTL_SECONDS = 26 * 60 * 60;

type InsightsPayload = { insights: unknown[]; generatedFor: string };

// Single-flight dedupe: concurrent duplicate requests for the same user/day
// (e.g. React StrictMode double-mounts or rapid remounts) share one LLM
// generation instead of billing tokens twice.
const inFlight = new Map<string, Promise<InsightsPayload>>();

async function getInsights(userId: string, cacheKey: string): Promise<InsightsPayload> {
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    const startedAt = Date.now();
    try {
      const { insights, inputTokens, outputTokens } = await generateInsights({ userId });

      const payload: InsightsPayload = {
        insights,
        generatedFor: new Date().toISOString().slice(0, 10),
      };
      try {
        await kv.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS });
      } catch {
        // Cache unavailable — the response still stands.
      }

      await AiUsageRepository.create({
        userId,
        feature: 'insights',
        model: getAiConfig().modelFor('structured'),
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - startedAt,
        status: 'OK',
      });

      return payload;
    } catch (error) {
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
      throw error;
    } finally {
      inFlight.delete(cacheKey);
    }
  })();

  inFlight.set(cacheKey, promise);
  return promise;
}

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');

    const todayKey = new Date().toISOString().slice(0, 10);
    const cacheKey = `ai_insights:${user.id}:${todayKey}`;

    // Cache-first: a repeat hit within the same day returns without a provider call or re-bill.
    try {
      const cached = (await kv.get(cacheKey)) as InsightsPayload | null;
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

    const payload = await getInsights(user.id, cacheKey);
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(toProviderHttpError(error) ?? unwrapProviderError(error));
  }
}
