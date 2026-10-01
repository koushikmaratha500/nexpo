import { describe, expect, it } from 'vitest';
import { isPublicAppPath } from '@/lib/auth/publicPaths';

describe('isPublicAppPath', () => {
  it('allows marketing and legal pages', () => {
    expect(isPublicAppPath('/')).toBe(true);
    expect(isPublicAppPath('/faq')).toBe(true);
    expect(isPublicAppPath('/privacy-policy')).toBe(true);
    expect(isPublicAppPath('/terms-and-conditions')).toBe(true);
    expect(isPublicAppPath('/terms-of-use')).toBe(true);
    expect(isPublicAppPath('/pricing')).toBe(true);
  });

  it('allows auth and share routes', () => {
    expect(isPublicAppPath('/auth/login')).toBe(true);
    expect(isPublicAppPath('/r/abc123')).toBe(true);
  });

  it('requires auth for app areas', () => {
    expect(isPublicAppPath('/customer')).toBe(false);
    expect(isPublicAppPath('/customer/settings')).toBe(false);
    expect(isPublicAppPath('/admin')).toBe(false);
  });
});
