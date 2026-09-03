import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { SupportService } from '@/lib/api/services/support.service';

vi.mock('@/lib/api/middleware/authGuard', () => ({
  authGuard: vi.fn(),
}));

vi.mock('@/lib/api/services/support.service', () => ({
  SupportService: {
    getTickets: vi.fn(),
  },
}));

const mockedAuthGuard = vi.mocked(authGuard);
const mockedGetTickets = vi.mocked(SupportService.getTickets);

describe('admin support route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/support returns 401 without auth', async () => {
    mockedAuthGuard.mockRejectedValue(new HttpError(401, 'Unauthorized'));
    const { GET } = await import('@/app/api/admin/support/route');
    const res = await GET(new NextRequest('http://localhost/api/admin/support'));
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/support returns 403 for customer role', async () => {
    mockedAuthGuard.mockRejectedValue(new HttpError(403, 'Insufficient permissions'));
    const { GET } = await import('@/app/api/admin/support/route');
    const res = await GET(
      new NextRequest('http://localhost/api/admin/support', {
        headers: { Authorization: 'Bearer customer-token' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('GET /api/admin/support returns paginated tickets for admin', async () => {
    mockedAuthGuard.mockResolvedValue({ id: 'admin-1', email: 'admin@nexpo.com', role: 'ADMIN' } as never);
    mockedGetTickets.mockResolvedValue({
      items: [{ id: 'ticket-1', status: 'A', name: 'Alex', email: 'alex@example.com' }],
      total: 1,
    } as never);

    const { GET } = await import('@/app/api/admin/support/route');
    const res = await GET(
      new NextRequest('http://localhost/api/admin/support?page=1&pageSize=10', {
        headers: { Authorization: 'Bearer admin-token' },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(mockedGetTickets).toHaveBeenCalledWith(1, 10, undefined);
  });
});

describe('admin settings route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/settings returns 403 for customer role', async () => {
    mockedAuthGuard.mockRejectedValue(new HttpError(403, 'Insufficient permissions'));
    const { GET } = await import('@/app/api/admin/settings/route');
    const res = await GET(
      new NextRequest('http://localhost/api/admin/settings', {
        headers: { Authorization: 'Bearer customer-token' },
      }),
    );
    expect(res.status).toBe(403);
  });
});
