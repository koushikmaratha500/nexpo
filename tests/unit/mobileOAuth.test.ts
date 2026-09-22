import { describe, expect, it } from 'vitest';
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

  it('builds app return URLs with query params', () => {
    expect(
      buildMobileAppReturnUrl('paysasuchan://auth/callback', {
        token: 'abc123',
        success: '1',
      }),
    ).toBe('paysasuchan://auth/callback?token=abc123&success=1');
  });
});
