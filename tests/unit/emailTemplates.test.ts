import { describe, expect, it } from 'vitest';
import {
  buildPasswordResetEmailHtml,
  buildVerificationEmailHtml,
} from '@/lib/api/utils/emailTemplates';

describe('emailTemplates', () => {
  it('includes OTP in verification template', () => {
    const html = buildVerificationEmailHtml('123456');
    expect(html).toContain('123456');
    expect(html).toContain('PaysaSuchan');
    expect(html).toContain('15 minutes');
  });

  it('includes reset link in password reset template', () => {
    const link = 'http://localhost:3000/auth/reset-password?token=abc123';
    const html = buildPasswordResetEmailHtml(link, false);
    expect(html).toContain(link);
    expect(html).toContain('Reset password');
  });
});
