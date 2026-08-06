import { describe, expect, it, vi } from 'vitest';
import { withModelFallbackList } from '@/lib/ai/provider';
import type { LanguageModel } from 'ai';

function models(...ids: string[]) {
  return ids.map((id) => id as unknown as LanguageModel);
}

const FALLBACK = ['model-a', 'model-b'];

describe('withModelFallbackList', () => {
  it('retries with the next model on a retryable error and resolves', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const calls: string[] = [];
    const result = await withModelFallbackList(models('model-a', 'model-b'), FALLBACK, 'ocr', async (m) => {
      calls.push(String(m));
      if (String(m) === 'model-a') throw new Error('Rate limit exceeded');
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(calls).toEqual(['model-a', 'model-b']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('model-b'));
    warn.mockRestore();
  });

  it('does not fall back when the error is not retryable', async () => {
    const calls: string[] = [];
    await expect(
      withModelFallbackList(models('model-a', 'model-b'), FALLBACK, 'ocr', async (m) => {
        calls.push(String(m));
        throw new Error('model not found');
      })
    ).rejects.toThrow('model not found');

    expect(calls).toEqual(['model-a']);
  });

  it('uses the first model when it succeeds on the first attempt', async () => {
    const calls: string[] = [];
    const result = await withModelFallbackList(models('model-a', 'model-b'), FALLBACK, 'ocr', async (m) => {
      calls.push(String(m));
      return String(m);
    });

    expect(result).toBe('model-a');
    expect(calls).toEqual(['model-a']);
  });
});
