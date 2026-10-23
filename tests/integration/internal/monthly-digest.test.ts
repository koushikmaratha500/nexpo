import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/internal/monthly-digest/route';

vi.mock('@/lib/api/services/monthly-digest-dispatch.service', () => ({
  MonthlyDigestDispatchService: {
    dispatch: vi.fn().mockResolvedValue({ status: 'preview', eligibleUsers: 0 }),
  },
}));

describe('POST /api/internal/monthly-digest', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MONTHLY_DIGEST_DISPATCH_SECRET = 'digest-secret';
  });

  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/internal/monthly-digest', {
      method: 'POST',
      body: JSON.stringify({ period: 'previous_month', mode: 'preview' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('dispatches when authorized', async () => {
    const { MonthlyDigestDispatchService } = await import(
      '@/lib/api/services/monthly-digest-dispatch.service'
    );
    const req = new Request('http://localhost/api/internal/monthly-digest', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-monthly-digest-dispatch-secret': 'digest-secret',
      },
      body: JSON.stringify({ period: 'previous_month', mode: 'preview' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(MonthlyDigestDispatchService.dispatch).toHaveBeenCalled();
  });
});
