import { describe, expect, it } from 'vitest';
import { verifyTinesBridgeAuth } from '@/lib/webhooks/tinesBridgeAuth';

describe('verifyTinesBridgeAuth', () => {
  it('accepts matching bearer token', () => {
    expect(verifyTinesBridgeAuth('Bearer secret-123', 'secret-123')).toBe(true);
  });

  it('rejects wrong token', () => {
    expect(verifyTinesBridgeAuth('Bearer wrong', 'secret-123')).toBe(false);
  });

  it('rejects missing header', () => {
    expect(verifyTinesBridgeAuth(null, 'secret-123')).toBe(false);
  });
});
