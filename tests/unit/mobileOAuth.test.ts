import { describe, expect, it, vi } from 'vitest';
import {
  buildMobileAppReturnUrl,
  isAllowedMobileAppRedirect,
} from '@/lib/auth/mobileOAuth';

describe('mobileOAuth', () => {
  it('allows Expo and standalone app redirect schemes', () => {
    expect(isAllowedMobileAppRedirect('paysasuchan://auth/callback')).toBe(true);
    expect(isAllowedMobileAppRedirect('exp://192.168.1.10:8081/--/auth/callback')).toBe(true);
    expect(isAllowedMobileAppRedirect('https://evil.com/auth/callback')).toBe(false);
  });

  it('rejects Expo Go redirects in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      expect(isAllowedMobileAppRedirect('exp://attacker.example/--/auth/callback')).toBe(false);
      expect(isAllowedMobileAppRedirect('paysasuchan://auth/callback')).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('builds app return URLs with query params', () => {
    expect(
      buildMobileAppReturnUrl('paysasuchan://auth/callback', {
        token: 'abc123',
        success: '1',
      }),
    ).toBe('paysasuchan://auth/callback?token=abc123&success=1');
  });
});
