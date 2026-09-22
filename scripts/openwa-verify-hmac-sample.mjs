#!/usr/bin/env node
/**
 * Local HMAC verification sample — matches lib/openwa/verifyWebhookSignature.ts
 * Usage: OPENWA_WEBHOOK_SECRET=your-secret node scripts/openwa-verify-hmac-sample.mjs
 */
import { createHmac, timingSafeEqual } from 'crypto';

const secret = process.env.OPENWA_WEBHOOK_SECRET || 'paysasuchan-openwa-poc-secret-change-me';
const body = JSON.stringify({ event: 'message.received', message: { body: 'test' } });

const signature = `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;

function verify(rawBody, sig, sec) {
  if (!sig || !sec) return false;
  const expected = `sha256=${createHmac('sha256', sec).update(rawBody, 'utf8').digest('hex')}`;
  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

console.log('Body:', body);
console.log('Signature:', signature);
console.log('Valid:', verify(body, signature, secret));
console.log('Invalid (should be false):', verify(body, 'sha256=bad', secret));
