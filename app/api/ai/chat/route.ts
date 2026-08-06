import { NextRequest } from 'next/server';
import { streamText, convertToModelMessages, isStepCount, type UIMessage } from 'ai';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError, HttpError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit } from '@/lib/api/middleware/rateLimiter';
import { AiUsageRepository } from '@/lib/api/repositories/aiUsage.repository';
import { getAiConfig } from '@/lib/ai/config';
import { getModel } from '@/lib/ai/provider';
import { createFinanceTools } from '@/lib/ai/tools/finance.tools';
import { COPILOT_SYSTEM } from '@/lib/ai/agents/copilot.system';
import { toProviderHttpError, unwrapProviderError } from '@/lib/ai/errors';

const CHAT_DAILY_LIMIT = 20;
const CHAT_WINDOW_SECONDS = 24 * 60 * 60;
const MAX_HISTORY_MESSAGES = 20;

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let userId: string | undefined;

  try {
    const user = await authGuard(req, 'CUSTOMER');
    userId = user.id;

    await checkRateLimit(req, `ai_chat:${user.id}`, {
      limit: CHAT_DAILY_LIMIT,
      windowSeconds: CHAT_WINDOW_SECONDS,
    });

    const body = (await req.json().catch(() => {
      throw new HttpError(400, 'Invalid JSON body');
    })) as { messages?: UIMessage[] };
    const history = (Array.isArray(body.messages) ? body.messages : []).slice(-MAX_HISTORY_MESSAGES);
    const modelMessages = await convertToModelMessages(history);

    const today = new Date();
    const system = `${COPILOT_SYSTEM} Today's date is ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}. Always interpret relative references like "last month" or "this month" against this date.`;

    const result = streamText({
      model: getModel('chat'),
      system,
      messages: modelMessages,
      tools: createFinanceTools(user.id, new Date()),
      abortSignal: req.signal,
      stopWhen: isStepCount(3),
      onFinish: async (event) => {
        try {
          await AiUsageRepository.create({
            userId: user.id,
            feature: 'chat',
            model: getAiConfig().modelFor('chat'),
            inputTokens: event.usage.inputTokens,
            outputTokens: event.usage.outputTokens,
            latencyMs: Date.now() - startedAt,
            status: 'OK',
          });
        } catch {
          // Audit logging must never break the stream.
        }
      },
      onError: async (error) => {
        try {
          await AiUsageRepository.create({
            userId: user.id,
            feature: 'chat',
            model: getAiConfig().modelFor('chat'),
            latencyMs: Date.now() - startedAt,
            status: 'ERROR',
            error: unwrapProviderError(error).message.slice(0, 500),
          });
        } catch {
          // Audit logging must never break the stream.
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (userId && !(error instanceof HttpError && error.status === 429)) {
      await AiUsageRepository.create({
        userId,
        feature: 'chat',
        model: getAiConfig().modelFor('chat'),
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
