import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('monthlyDigestDispatchAuth', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MONTHLY_DIGEST_DISPATCH_SECRET = 'digest-secret';
  });

  it('rejects missing secret header', async () => {
    const { assertMonthlyDigestDispatchAuthorized } = await import(
      '@/lib/api/utils/monthlyDigestDispatchAuth'
    );
    const req = new Request('http://localhost/api/internal/monthly-digest', { method: 'POST' });
    expect(() => assertMonthlyDigestDispatchAuthorized(req)).toThrow(/Unauthorized/);
  });

  it('accepts matching digest secret', async () => {
    const { assertMonthlyDigestDispatchAuthorized } = await import(
      '@/lib/api/utils/monthlyDigestDispatchAuth'
    );
    const req = new Request('http://localhost/api/internal/monthly-digest', {
      method: 'POST',
      headers: { 'x-monthly-digest-dispatch-secret': 'digest-secret' },
    });
    expect(() => assertMonthlyDigestDispatchAuthorized(req)).not.toThrow();
  });
});
