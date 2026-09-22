import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import { verifyOpenWASignature } from '@/lib/openwa/verifyWebhookSignature';

describe('verifyOpenWASignature', () => {
  const secret = 'test-webhook-secret';
  const body = '{"event":"message.received"}';

  function sign(payload: string) {
    return `sha256=${createHmac('sha256', secret).update(payload, 'utf8').digest('hex')}`;
  }

  it('accepts a valid signature', () => {
    expect(verifyOpenWASignature(body, sign(body), secret)).toBe(true);
  });

  it('rejects invalid signature', () => {
    expect(verifyOpenWASignature(body, 'sha256=deadbeef', secret)).toBe(false);
  });

  it('rejects missing signature', () => {
    expect(verifyOpenWASignature(body, null, secret)).toBe(false);
  });
});
