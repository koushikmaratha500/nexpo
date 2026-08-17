import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import { getAiConfig, isAiConfigured, modelListFor, type ModelKind } from './config';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { isRetryableModelError } from './errors';
let openrouter: ReturnType<typeof createOpenRouter> | null = null;

export function getOpenRouter(): ReturnType<typeof createOpenRouter> {
  if (!isAiConfigured()) {
    throw new HttpError(503, 'AI is not configured. Set OPENROUTER_API_KEY in your environment.');
  }
  openrouter ??= createOpenRouter({ apiKey: getAiConfig().apiKey });
  return openrouter;
}

export function getModelList(kind: ModelKind): LanguageModel[] {
  return modelListFor(kind).map((id) => getOpenRouter()(id));
}

export function getModel(kind: ModelKind): LanguageModel {
  return getModelList(kind)[0];
}

export function withModelFallback<T>(
  kind: ModelKind,
  fn: (model: LanguageModel) => Promise<T>
): Promise<T> {
  const ids = modelListFor(kind);
  return withModelFallbackList(getModelList(kind), ids, kind, fn);
}

export async function withModelFallbackList<T>(
  models: LanguageModel[],
  modelIds: string[],
  kind: ModelKind,
  fn: (model: LanguageModel) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < models.length; i += 1) {
    try {
      return await fn(models[i]);
    } catch (error) {
      lastError = error;
      const canFallback = i < models.length - 1 && isRetryableModelError(error);
      console.warn(
        `[ai] ${kind} model "${modelIds[i] ?? models[i]}" failed: ${error instanceof Error ? error.message : error}` +
          (canFallback ? ` \u2192 falling back to "${modelIds[i + 1] ?? models[i + 1]}"` : '')
      );
      if (!canFallback) throw error;
    }
  }

  throw lastError;
}
