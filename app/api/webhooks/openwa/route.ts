import { NextRequest, NextResponse } from 'next/server';
import { verifyOpenWASignature } from '@/lib/openwa/verifyWebhookSignature';

/**
 * Phase 0 POC — OpenWA webhook receiver with HMAC verification.
 * Later: forward to Tines or enqueue for bot engine.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.OPENWA_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: 'OPENWA_WEBHOOK_SECRET is not configured' },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-openwa-signature');

  if (!verifyOpenWASignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = req.headers.get('x-openwa-event') ?? 'unknown';
  const idempotencyKey = req.headers.get('x-openwa-idempotency-key');

  if (process.env.NODE_ENV === 'development') {
    console.info('[openwa webhook]', {
      event: eventName,
      idempotencyKey,
      payload: event,
    });
  }

  return NextResponse.json({
    ok: true,
    event: eventName,
    idempotencyKey,
    receivedAt: new Date().toISOString(),
  });
}
