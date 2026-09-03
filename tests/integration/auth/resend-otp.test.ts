import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@/lib/api/services/auth.service';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { OtpService } from '@/lib/api/services/otp.service';

vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: {
    findByEmail: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/otp.service', () => ({
  OtpService: {
    createOtp: vi.fn(),
  },
}));

const mockedFindByEmail = vi.mocked(UserRepository.findByEmail);
const mockedCreateOtp = vi.mocked(OtpService.createOtp);

describe('AuthService.resendVerificationOtp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateOtp.mockResolvedValue('654321');
  });

  it('sends a new OTP for pending users', async () => {
    mockedFindByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'pending@example.com',
      status: 'P',
    } as never);

    const result = await AuthService.resendVerificationOtp('pending@example.com');

    expect(result.success).toBe(true);
    expect(mockedCreateOtp).toHaveBeenCalledWith('pending@example.com', true);
  });

  it('does not reveal whether email exists for active users', async () => {
    mockedFindByEmail.mockResolvedValue({
      id: 'user-2',
      email: 'active@example.com',
      status: 'A',
    } as never);

    const result = await AuthService.resendVerificationOtp('active@example.com');

    expect(result.success).toBe(true);
    expect(mockedCreateOtp).not.toHaveBeenCalled();
  });
});
