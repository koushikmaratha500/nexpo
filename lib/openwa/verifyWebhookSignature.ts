import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify OpenWA webhook HMAC per docs/examples/webhook-signature-verification.md
 * Header: X-OpenWA-Signature: sha256=<hex>
 */
export function verifyOpenWASignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;

  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expected = `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;

  try {
    const a = Buffer.from(signatureHeader, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
