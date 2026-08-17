import { HttpError } from '@/lib/api/middleware/errorHandler';

export function unwrapProviderError(error: unknown): Error {
  let current = error;
  const visited = new Set<unknown>();
  while (current instanceof Error && !visited.has(current)) {
    visited.add(current);
    const retry = current as { name?: string; lastError?: unknown; errors?: unknown[] };
    if (retry.name === 'AI_RetryError') {
      const last = retry.errors?.[retry.errors.length - 1] ?? retry.lastError;
      if (last && last !== current) {
        current = last;
        continue;
      }
    }
    break;
  }
  return current instanceof Error ? current : new Error(String(current));
}

export function providerStatus(error: unknown): number | null {
  const root = unwrapProviderError(error);
  const withStatus = root as { statusCode?: unknown; status?: unknown };
  const raw = withStatus.statusCode ?? withStatus.status;
  return typeof raw === 'number' ? raw : null;
}

export function isRetryableModelError(error: unknown): boolean {
  const root = unwrapProviderError(error);
  const status = providerStatus(root);
  if (status !== null) {
    return status === 429 || (status >= 500 && status <= 599);
  }
  return /rate limit|too many requests|overloaded|capacity|temporarily unavailable|5\d\d/i.test(
    root.message
  );
}

export function isProviderRateLimitError(error: unknown): boolean {
  const root = unwrapProviderError(error);
  const status = providerStatus(root);
  if (status === 429) return true;
  return /rate limit|too many requests|free-models-per-day/i.test(root.message);
}

export function toProviderHttpError(error: unknown): HttpError | null {
  const root = unwrapProviderError(error);
  if (isProviderRateLimitError(root)) {
    return new HttpError(429, `AI service is rate limited: ${root.message}`);
  }
  const status = providerStatus(root);
  if (status !== null && status >= 500 && status <= 599) {
    return new HttpError(503, `AI service is temporarily unavailable: ${root.message}`);
  }
  return null;
}
