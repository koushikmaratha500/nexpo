import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@/lib/api/services/auth.service';
import { OtpService } from '@/lib/api/services/otp.service';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { SessionRepository } from '@/lib/api/repositories/session.repository';
import { comparePassword } from '@/lib/api/services/auth.service';

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
    findCountryByName: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/api/services/otp.service', () => ({
  OtpService: {
    createOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/email.service', () => ({
  EmailService: {
    sendOtpEmail: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/session.repository', () => ({
  SessionRepository: {
    create: vi.fn(),
  },
}));

const mockedFindByEmail = vi.mocked(UserRepository.findByEmail);
const mockedFindByUsername = vi.mocked(UserRepository.findByUsername);
const mockedCreateUser = vi.mocked(UserRepository.create);
const mockedCreateOtp = vi.mocked(OtpService.createOtp);
const mockedVerifyOtp = vi.mocked(OtpService.verifyOtp);
const mockedUpdateUser = vi.mocked(UserRepository.update);
const mockedCreateSession = vi.mocked(SessionRepository.create);

describe('register → verify → login flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a pending user and sends OTP', async () => {
    mockedFindByEmail.mockResolvedValue(null);
    mockedFindByUsername.mockResolvedValue(null);
    mockedCreateUser.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      username: 'new_user',
      firstName: 'New',
      lastName: null,
      status: 'P',
    } as never);
    mockedCreateOtp.mockResolvedValue('123456');

    const { user, otp } = await AuthService.registerUser({
      username: 'new_user',
      firstName: 'New',
      email: 'new@example.com',
      password: 'SecurePass123!',
    });

    expect(user.email).toBe('new@example.com');
    expect(otp).toBe('123456');
    expect(mockedCreateOtp).toHaveBeenCalledWith('new@example.com', true);
  });

  it('activates user after valid OTP verification', async () => {
    mockedVerifyOtp.mockResolvedValue(true);
    mockedFindByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      status: 'P',
    } as never);

    const result = await AuthService.verifyUserOtp('new@example.com', '123456');
    expect(result.success).toBe(true);
    expect(mockedUpdateUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ status: 'A', emailVerified: true }),
    );
  });

  it('logs in an active user and creates a session', async () => {
    const password = 'SecurePass123!';
    const { hashPassword } = await import('@/lib/api/services/auth.service');
    const passwordHash = hashPassword(password);

    mockedFindByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      status: 'A',
      forcedResetPassword: false,
      passwordHash,
    } as never);
    mockedCreateSession.mockResolvedValue({ id: 'sess-1' } as never);

    const result = await AuthService.loginUser('new@example.com', password);
    expect(result.token).toBeTruthy();
    expect(comparePassword(password, passwordHash)).toBe(true);
    expect(mockedCreateSession).toHaveBeenCalled();
  });
});
