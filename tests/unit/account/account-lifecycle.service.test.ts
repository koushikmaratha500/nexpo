import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountLifecycleService } from '@/lib/api/services/account-lifecycle.service';
import { AccountLifecycleRepository } from '@/lib/api/repositories/account-lifecycle.repository';
import { SessionRepository } from '@/lib/api/repositories/session.repository';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { AccountLifecycleOtpService } from '@/lib/api/services/account-lifecycle-otp.service';

vi.mock('@/lib/api/repositories/account-lifecycle.repository', () => ({
  AccountLifecycleRepository: {
    findUserById: vi.fn(),
    updateUserLifecycle: vi.fn(),
    markPersonalTransactionsForReset: vi.fn(),
    clearPersonalImportArtifacts: vi.fn(),
    hardDeleteResetBatch: vi.fn(),
    restoreResetBatch: vi.fn(),
    clearLifecycleFields: vi.fn(),
    serializeLifecycle: vi.fn(),
    listDueForPurge: vi.fn(),
    hardDeleteUser: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/session.repository', () => ({
  SessionRepository: { invalidateAllForUser: vi.fn() },
}));

vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: { createAudit: vi.fn() },
}));

vi.mock('@/lib/api/services/account-lifecycle-otp.service', () => ({
  AccountLifecycleOtpService: {
    verifyOtp: vi.fn(),
  },
}));

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'salt:hash',
  accountLifecycleMode: 'ACTIVE' as const,
  accountLifecycleAt: null,
  accountLifecyclePurgeAt: null,
  accountLifecycleBatchId: null,
  status: 'A' as const,
};

const mockedFindUser = vi.mocked(AccountLifecycleRepository.findUserById);
const mockedMarkReset = vi.mocked(AccountLifecycleRepository.markPersonalTransactionsForReset);
const mockedUpdateLifecycle = vi.mocked(AccountLifecycleRepository.updateUserLifecycle);
const mockedSerialize = vi.mocked(AccountLifecycleRepository.serializeLifecycle);
const mockedVerifyOtp = vi.mocked(AccountLifecycleOtpService.verifyOtp);
const mockedInvalidateSessions = vi.mocked(SessionRepository.invalidateAllForUser);

describe('AccountLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFindUser.mockResolvedValue(baseUser as never);
    mockedVerifyOtp.mockResolvedValue(undefined);
    mockedMarkReset.mockResolvedValue(3);
    mockedUpdateLifecycle.mockImplementation(async (userId, data) => ({
      ...baseUser,
      ...data,
    }));
    mockedSerialize.mockReturnValue({
      mode: 'RESET_PENDING',
      requested_at: new Date().toISOString(),
      purge_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      days_remaining: 7,
      can_restore: true,
    });
  });

  it('requests reset and hides personal transactions', async () => {
    const result = await AccountLifecycleService.requestReset(
      'user-1',
      { confirmation: 'RESET', channel: 'email', otp: '123456' },
      { ip: '', ua: '' },
    );

    expect(mockedMarkReset).toHaveBeenCalled();
    expect(result.hidden_transactions).toBe(3);
    expect(mockedUpdateLifecycle).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ accountLifecycleMode: 'RESET_PENDING' }),
    );
  });

  it('schedules delete and invalidates sessions', async () => {
    mockedUpdateLifecycle.mockResolvedValue({
      ...baseUser,
      accountLifecycleMode: 'DELETE_PENDING',
      accountLifecyclePurgeAt: new Date(Date.now() + 7 * 86400000),
    } as never);

    const result = await AccountLifecycleService.requestDelete(
      'user-1',
      { confirmation: 'DELETE', channel: 'sms', otp: '123456' },
      { ip: '', ua: '' },
    );

    expect(mockedInvalidateSessions).toHaveBeenCalledWith('user-1');
    expect(result.logged_out).toBe(true);
  });
});
