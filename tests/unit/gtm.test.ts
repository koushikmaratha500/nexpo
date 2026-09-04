import { afterEach, describe, expect, it, vi } from 'vitest';
import { getGoogleTagManagerId } from '@/lib/analytics/gtm';

describe('getGoogleTagManagerId', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a valid GTM container id', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-MVSSX5X5');
    expect(getGoogleTagManagerId()).toBe('GTM-MVSSX5X5');
  });

  it('ignores invalid values', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'not-a-gtm-id');
    expect(getGoogleTagManagerId()).toBeNull();
  });
});
