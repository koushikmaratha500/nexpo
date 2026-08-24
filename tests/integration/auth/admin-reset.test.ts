import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@/lib/api/services/auth.service';
import { AdminRepository } from '@/lib/api/repositories/admin.repository';
import { PasswordResetTokenRepository } from '@/lib/api/repositories/password-reset-token.repository';
import { EmailService } from '@/lib/api/services/email.service';

vi.mock('@/lib/api/repositories/admin.repository', () => ({
  AdminRepository: {
    findByEmail: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/password-reset-token.repository', () => ({
  PasswordResetTokenRepository: {
    invalidateActiveForAdmin: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/email.service', () => ({
  EmailService: {
    sendPasswordResetEmail: vi.fn(),
  },
}));

const mockedFindAdmin = vi.mocked(AdminRepository.findByEmail);

describe('admin forgot-password production safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EXPOSE_DEV_RESET_TOKEN', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not expose resetToken when EXPOSE_DEV_RESET_TOKEN is unset', async () => {
    mockedFindAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@nexpo.com',
    } as never);

    const result = await AuthService.forgotAdminPassword('admin@nexpo.com');
    expect(result.success).toBe(true);
    expect(result).not.toHaveProperty('resetToken');
    expect(EmailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('returns simulated success for unknown email without leaking resetToken', async () => {
    mockedFindAdmin.mockResolvedValue(null);

    const result = await AuthService.forgotAdminPassword('missing@example.com');
    expect(result.success).toBe(true);
    expect(result).not.toHaveProperty('resetToken');
  });
});

describe('admin forgot-password dev token exposure', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes resetToken only in development with EXPOSE_DEV_RESET_TOKEN=true', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('EXPOSE_DEV_RESET_TOKEN', 'true');
    mockedFindAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@nexpo.com',
    } as never);

    const result = await AuthService.forgotAdminPassword('admin@nexpo.com');
    expect('resetToken' in result && result.resetToken).toBeTruthy();
  });
});
