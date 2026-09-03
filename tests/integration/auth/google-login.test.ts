import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@prisma/client';
import { AuthService } from '@/lib/api/services/auth.service';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { SessionRepository } from '@/lib/api/repositories/session.repository';

vi.mock('@/lib/supabase/verifyAccessToken', () => ({
  verifySupabaseAccessToken: vi.fn(),
}));

vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: {
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    create: vi.fn(),
    createAudit: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/meta.repository', () => ({
  MetaRepository: {
    findCountryByName: vi.fn().mockResolvedValue({ id: 'country-1', currencyId: 'currency-1' }),
  },
}));

vi.mock('@/lib/api/repositories/session.repository', () => ({
  SessionRepository: {
    create: vi.fn(),
  },
}));

const { verifySupabaseAccessToken } = await import('@/lib/supabase/verifyAccessToken');
const mockedVerify = vi.mocked(verifySupabaseAccessToken);
const mockedFindByEmail = vi.mocked(UserRepository.findByEmail);
const mockedFindByUsername = vi.mocked(UserRepository.findByUsername);
const mockedCreateUser = vi.mocked(UserRepository.create);
const mockedUpdateUser = vi.mocked(UserRepository.update);
const mockedCreateSession = vi.mocked(SessionRepository.create);

describe('AuthService.loginWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedVerify.mockResolvedValue({
      id: 'google-user-1',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      avatarUrl: 'https://example.com/avatar.png',
    });
    mockedCreateSession.mockResolvedValue({ id: 'session-1' } as never);
  });

  it('creates a new active user when email is unknown', async () => {
    mockedFindByEmail.mockResolvedValue(null);
    mockedFindByUsername.mockResolvedValue(null);
    mockedCreateUser.mockResolvedValue({
      id: 'user-1',
      email: 'google@example.com',
      username: 'google_user',
      firstName: 'Google',
      lastName: 'User',
      status: 'A',
      provider: AuthProvider.GOOGLE,
    } as never);

    const result = await AuthService.loginWithGoogle('supabase-access-token', { ip: '127.0.0.1', ua: 'vitest' });

    expect(mockedVerify).toHaveBeenCalledWith('supabase-access-token');
    expect(mockedCreateUser).toHaveBeenCalled();
    expect(result.user.email).toBe('google@example.com');
    expect(result.token).toBeTruthy();
  });

  it('activates pending users and issues a session', async () => {
    mockedFindByEmail.mockResolvedValue({
      id: 'user-2',
      email: 'google@example.com',
      status: 'P',
      profileImageUrl: null,
    } as never);
    mockedUpdateUser.mockResolvedValue({
      id: 'user-2',
      email: 'google@example.com',
      status: 'A',
      provider: AuthProvider.GOOGLE,
    } as never);

    const result = await AuthService.loginWithGoogle('supabase-access-token');

    expect(mockedUpdateUser).toHaveBeenCalledWith(
      'user-2',
      expect.objectContaining({ status: 'A', provider: AuthProvider.GOOGLE }),
    );
    expect(result.token).toBeTruthy();
  });

  it('rejects blocked accounts', async () => {
    mockedFindByEmail.mockResolvedValue({
      id: 'user-3',
      email: 'google@example.com',
      status: 'B',
    } as never);

    await expect(AuthService.loginWithGoogle('supabase-access-token')).rejects.toThrow(/blocked/);
  });
});
