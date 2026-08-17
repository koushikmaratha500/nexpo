import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('provider', () => {
  it('throws HttpError 503 when OPENROUTER_API_KEY is unset', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('AI_ENABLED', 'true');
    vi.resetModules();

    const { getModel } = await import('@/lib/ai/provider');
    const { HttpError } = await import('@/lib/api/middleware/errorHandler');

    let thrown: unknown;
    try {
      getModel('ocr');
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(HttpError);
    expect((thrown as { status?: number }).status).toBe(503);
  });

  it('throws HttpError 503 when AI is disabled via AI_ENABLED=false', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'sk-test');
    vi.stubEnv('AI_ENABLED', 'false');
    vi.resetModules();

    const { getModel } = await import('@/lib/ai/provider');

    expect(() => getModel('chat')).toThrow(/not configured/i);
  });
});
