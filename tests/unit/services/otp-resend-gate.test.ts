import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OtpService } from '@/lib/api/services/otp.service';
import { EmailService } from '@/lib/api/services/email.service';
import { getDevOtpCode, isResendEnabled } from '@/lib/api/utils/emailConfig';

vi.mock('@/lib/api/services/email.service', () => ({
  EmailService: {
    sendOtpEmail: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('@/lib/api/utils/redisClient', () => ({
  isProductionEnv: vi.fn(() => false),
  isRedisConfigured: vi.fn(() => false),
  kvSetJson: vi.fn().mockResolvedValue(undefined),
  kvGetJson: vi.fn(),
  kvDelete: vi.fn().mockResolvedValue(undefined),
}));

describe('emailConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to disabled without RESEND_API_KEY', () => {
    vi.stubEnv('ENABLE_RESEND', '');
    vi.stubEnv('RESEND_API_KEY', '');
    expect(isResendEnabled()).toBe(false);
  });

  it('auto-enables when RESEND_API_KEY is set', () => {
    vi.stubEnv('ENABLE_RESEND', '');
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    expect(isResendEnabled()).toBe(true);
  });

  it('respects explicit ENABLE_RESEND=false even with API key', () => {
    vi.stubEnv('ENABLE_RESEND', 'false');
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    expect(isResendEnabled()).toBe(false);
  });

  it('defaults DEV_OTP_CODE to 123456', () => {
    vi.stubEnv('DEV_OTP_CODE', '');
    expect(getDevOtpCode()).toBe('123456');
  });
});

describe('OtpService resend gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses fixed dev OTP and skips email when ENABLE_RESEND=false', async () => {
    vi.stubEnv('ENABLE_RESEND', 'false');

    const code = await OtpService.createOtp('dev@example.com', true);

    expect(code).toBe('123456');
    expect(EmailService.sendOtpEmail).not.toHaveBeenCalled();
  });

  it('generates random OTP and sends email when ENABLE_RESEND=true', async () => {
    vi.stubEnv('ENABLE_RESEND', 'true');
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.spyOn(OtpService, 'generateOtp').mockReturnValue('654321');

    const code = await OtpService.createOtp('live@example.com', true);

    expect(code).toBe('654321');
    expect(EmailService.sendOtpEmail).toHaveBeenCalledWith('live@example.com', '654321');
  });

  it('throws when Resend send fails with ENABLE_RESEND=true', async () => {
    vi.stubEnv('ENABLE_RESEND', 'true');
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.mocked(EmailService.sendOtpEmail).mockResolvedValueOnce({ success: false, error: new Error('send failed') });

    await expect(OtpService.createOtp('fail@example.com', true)).rejects.toThrow(
      'Failed to send verification email',
    );
  });
});
