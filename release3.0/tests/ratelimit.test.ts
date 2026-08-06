import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function loadMemoryRateLimiter() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
  vi.resetModules();
  return import('@/lib/api/middleware/rateLimiter');
}

function makeReq(): NextRequest {
  return new NextRequest('http://localhost/api/test', { method: 'POST' });
}

describe('checkRateLimit (memory fallback)', () => {
  it('allows requests within the limit and throws 429 past it', async () => {
    const { checkRateLimit } = await loadMemoryRateLimiter();
    const HttpErrorCtor = (await import('@/lib/api/middleware/errorHandler')).HttpError;

    const req = makeReq();
    await checkRateLimit(req, 'mem-test-1', { limit: 3, windowSeconds: 60 });
    await checkRateLimit(req, 'mem-test-1', { limit: 3, windowSeconds: 60 });
    await checkRateLimit(req, 'mem-test-1', { limit: 3, windowSeconds: 60 });

    let thrown: unknown;
    try {
      await checkRateLimit(req, 'mem-test-1', { limit: 3, windowSeconds: 60 });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(HttpErrorCtor);
    expect((thrown as { status?: number }).status).toBe(429);
  });

  it('resets the counter after the window elapses', async () => {
    vi.useFakeTimers();
    try {
      const { checkRateLimit } = await loadMemoryRateLimiter();

      const req = makeReq();
      await checkRateLimit(req, 'mem-test-2', { limit: 1, windowSeconds: 1 });
      let thrown: unknown;
      try {
        await checkRateLimit(req, 'mem-test-2', { limit: 1, windowSeconds: 1 });
      } catch (err) {
        thrown = err;
      }
      expect(thrown).not.toBeNull();

      await vi.advanceTimersByTimeAsync(1500);
      await expect(
        checkRateLimit(req, 'mem-test-2', { limit: 1, windowSeconds: 1 })
      ).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
