import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isProviderRateLimitError,
  isRetryableModelError,
  providerStatus,
  toProviderHttpError,
  unwrapProviderError,
} from '@/lib/ai/errors';
import { modelListFor } from '@/lib/ai/config';
import { HttpError } from '@/lib/api/middleware/errorHandler';

afterEach(() => {
  vi.unstubAllEnvs();
});

function retryWrapper(...errors: Error[]): Error {
  const wrapped = new Error(`Failed after ${errors.length} attempts. Last error: ${errors[errors.length - 1].message}`);
  Object.assign(wrapped, { name: 'AI_RetryError', errors, lastError: errors[errors.length - 1] });
  return wrapped as Error;
}

describe('provider error classification', () => {
  it('reads statusCode from thrown provider errors', () => {
    const err = new Error('upstream') as Error & { statusCode: number };
    err.statusCode = 429;
    expect(providerStatus(err)).toBe(429);
    expect(providerStatus('not an error')).toBeNull();
    expect(providerStatus(new Error('plain'))).toBeNull();
  });

  it('classifies 429 and 5xx as retryable', () => {
    const mk = (statusCode: number) => Object.assign(new Error('x'), { statusCode });
    expect(isRetryableModelError(mk(429))).toBe(true);
    expect(isRetryableModelError(mk(500))).toBe(true);
    expect(isRetryableModelError(mk(503))).toBe(true);
    expect(isRetryableModelError(mk(400))).toBe(false);
    expect(isRetryableModelError(new Error('Rate limit exceeded: free-models-per-day'))).toBe(true);
    expect(isRetryableModelError(new Error('model not found'))).toBe(false);
  });

  it('detects provider rate-limit errors including the wrapped retry message', () => {
    expect(isProviderRateLimitError(new Error('Rate limit exceeded: free-models-per-day'))).toBe(true);
    expect(isProviderRateLimitError(new Error('boom'))).toBe(false);
    expect(isProviderRateLimitError(Object.assign(new Error('x'), { statusCode: 429 }))).toBe(true);
  });

  it('maps provider errors to friendly HTTP errors', () => {
    const rateLimited = toProviderHttpError(new Error('Rate limit exceeded: free-models-per-day'));
    expect(rateLimited).toBeInstanceOf(HttpError);
    expect(rateLimited!.status).toBe(429);

    const down = toProviderHttpError(Object.assign(new Error('x'), { statusCode: 502 }));
    expect(down!.status).toBe(503);

    expect(toProviderHttpError(new Error('validation failed'))).toBeNull();
    expect(toProviderHttpError(Object.assign(new Error('x'), { statusCode: 400 }))).toBeNull();
  });

  it('surfaces a user-friendly rate-limit message', () => {
    const raw = 'Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day';
    const mapped = toProviderHttpError(retryWrapper(Object.assign(new Error(raw), { statusCode: 429 })));
    expect(mapped!.status).toBe(429);
    expect(mapped!.message).toContain('AI receipt scan is rate limited');
    expect(mapped!.message).toContain('openrouter.ai/settings/integrations');
  });

  it('unwraps AI SDK RetryError wrappers to the underlying cause', () => {
    const root = Object.assign(new Error('provider overloaded'), { statusCode: 503 });
    const wrapped = retryWrapper(new Error('boom'), root);

    expect(unwrapProviderError(wrapped)).toBe(root);
    expect(unwrapProviderError(root)).toBe(root);
    expect(providerStatus(wrapped)).toBe(503);
    expect(isRetryableModelError(wrapped)).toBe(true);
    expect(isProviderRateLimitError(retryWrapper(Object.assign(new Error('free-models-per-day'), { statusCode: 429 })))).toBe(true);
  });
});

describe('modelListFor', () => {
  it('returns the per-feature default model list', () => {
    expect(modelListFor('ocr')).toEqual([
      'google/gemma-4-26b-a4b-it:free',
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-2.0-flash-001',
    ]);
    expect(modelListFor('chat')).toContain('openrouter/free');
  });

  it('supports a comma-separated override as an ordered fallback list', () => {
    vi.stubEnv('AI_MODEL_OCR', 'model-a, model-b ,model-c');
    expect(modelListFor('ocr')).toEqual(['model-a', 'model-b', 'model-c']);
  });
});
