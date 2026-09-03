import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { SessionRepository } from '@/lib/api/repositories/session.repository';
import { verifyJwt } from '@/lib/api/services/auth.service';

vi.mock('@/lib/api/repositories/session.repository', () => ({
  SessionRepository: {
    findActiveByJwt: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/auth.service', () => ({
  verifyJwt: vi.fn(),
}));

const mockedVerifyJwt = vi.mocked(verifyJwt);
const mockedFindSession = vi.mocked(SessionRepository.findActiveByJwt);

describe('authGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = new NextRequest('http://localhost/api/user/dashboard');
    await expect(authGuard(req, 'CUSTOMER')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('returns 401 when token signature is invalid', async () => {
    mockedVerifyJwt.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/user/dashboard', {
      headers: { Authorization: 'Bearer invalid-token' },
    });

    await expect(authGuard(req, 'CUSTOMER')).rejects.toBeInstanceOf(HttpError);
    await expect(authGuard(req, 'CUSTOMER')).rejects.toMatchObject({ status: 401 });
  });

  it('returns 401 when session is inactive', async () => {
    mockedVerifyJwt.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'CUSTOMER' });
    mockedFindSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/user/dashboard', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    await expect(authGuard(req, 'CUSTOMER')).rejects.toMatchObject({ status: 401 });
  });

  it('returns 403 when role does not match', async () => {
    mockedVerifyJwt.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'CUSTOMER' });
    mockedFindSession.mockResolvedValue({ id: 'sess-1' } as never);

    const req = new NextRequest('http://localhost/api/admin/dashboard', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    await expect(authGuard(req, 'ADMIN')).rejects.toMatchObject({ status: 403 });
  });

  it('returns user payload when token and session are valid', async () => {
    mockedVerifyJwt.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'CUSTOMER' });
    mockedFindSession.mockResolvedValue({ id: 'sess-1' } as never);

    const req = new NextRequest('http://localhost/api/user/dashboard', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    const user = await authGuard(req, 'CUSTOMER');
    expect(user.id).toBe('u1');
    expect(user.role).toBe('CUSTOMER');
  });
});

describe('protected route handlers without token', () => {
  it('GET /api/user/dashboard returns 401 JSON error', async () => {
    const { GET } = await import('@/app/api/user/dashboard/route');
    const res = await GET(new NextRequest('http://localhost/api/user/dashboard'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('GET /api/admin/dashboard returns 401 JSON error', async () => {
    const { GET } = await import('@/app/api/admin/dashboard/route');
    const res = await GET(new NextRequest('http://localhost/api/admin/dashboard'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
