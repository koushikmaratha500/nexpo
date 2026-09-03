import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@/lib/api/services/auth.service';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { PasswordResetTokenRepository } from '@/lib/api/repositories/password-reset-token.repository';
import { SessionRepository } from '@/lib/api/repositories/session.repository';
import { EmailService } from '@/lib/api/services/email.service';

vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: {
    findByEmail: vi.fn(),
    update: vi.fn(),
    createAudit: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/password-reset-token.repository', () => ({
  PasswordResetTokenRepository: {
    invalidateActiveForUser: vi.fn(),
    create: vi.fn(),
    findByToken: vi.fn(),
    markInactive: vi.fn(),
    markUsed: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/session.repository', () => ({
  SessionRepository: {
    invalidateAllForUser: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/email.service', () => ({
  EmailService: {
    sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
  },
}));

const mockedFindUser = vi.mocked(UserRepository.findByEmail);
const mockedFindByToken = vi.mocked(PasswordResetTokenRepository.findByToken);
const mockedUpdateUser = vi.mocked(UserRepository.update);
const mockedMarkUsed = vi.mocked(PasswordResetTokenRepository.markUsed);

describe('customer forgot-password production safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EXPOSE_DEV_RESET_TOKEN', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not expose resetToken when EXPOSE_DEV_RESET_TOKEN is unset', async () => {
    mockedFindUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      status: 'A',
    } as never);

    const result = await AuthService.forgotUserPassword('user@example.com');
    expect(result.success).toBe(true);
    expect(result).not.toHaveProperty('resetToken');
    expect(EmailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('returns simulated success for unknown email without leaking resetToken', async () => {
    mockedFindUser.mockResolvedValue(null);

    const result = await AuthService.forgotUserPassword('missing@example.com');
    expect(result.success).toBe(true);
    expect(result).not.toHaveProperty('resetToken');
    expect(EmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('does not send reset email for pending users', async () => {
    mockedFindUser.mockResolvedValue({
      id: 'user-1',
      email: 'pending@example.com',
      status: 'P',
    } as never);

    const result = await AuthService.forgotUserPassword('pending@example.com');
    expect(result.success).toBe(true);
    expect(EmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('customer forgot-password dev token exposure', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes resetToken only in development with EXPOSE_DEV_RESET_TOKEN=true', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('EXPOSE_DEV_RESET_TOKEN', 'true');
    mockedFindUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      status: 'A',
    } as never);

    const result = await AuthService.forgotUserPassword('user@example.com');
    expect('resetToken' in result && result.resetToken).toBeTruthy();
  });
});

describe('customer reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resets password for a valid token', async () => {
    mockedFindByToken.mockResolvedValue({
      id: 'token-1',
      token: 'valid-token',
      email: 'user@example.com',
      userId: 'user-1',
      status: 'A',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    mockedUpdateUser.mockResolvedValue({ id: 'user-1' } as never);

    const result = await AuthService.resetUserPassword('valid-token', 'NewSecurePass1!');
    expect(result.success).toBe(true);
    expect(mockedUpdateUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passwordHash: expect.any(String),
        forcedResetPassword: false,
        lastPasswordChangedDate: expect.any(Date),
      }),
    );
    expect(mockedMarkUsed).toHaveBeenCalledWith('token-1');
    expect(SessionRepository.invalidateAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('rejects an already-used token', async () => {
    mockedFindByToken.mockResolvedValue({
      id: 'token-1',
      token: 'used-token',
      userId: 'user-1',
      status: 'A',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    await expect(AuthService.resetUserPassword('used-token', 'NewSecurePass1!')).rejects.toThrow(
      'Reset token has already been used',
    );
  });

  it('rejects an admin token on the customer reset path', async () => {
    mockedFindByToken.mockResolvedValue({
      id: 'token-1',
      token: 'admin-token',
      adminId: 'admin-1',
      userId: null,
      status: 'A',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    await expect(AuthService.resetUserPassword('admin-token', 'NewSecurePass1!')).rejects.toThrow(
      'Invalid or expired reset token',
    );
  });
});
