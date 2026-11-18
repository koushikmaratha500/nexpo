import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import { PlanStatus } from '@prisma/client';
import {
  parseRazorpayWebhookEvent,
  verifyRazorpaySignature,
} from '@/lib/billing/gateway/razorpay.gateway';
import { RENEWAL_GRACE_DAYS, starterAccessEndsAt } from '@/lib/billing/config';

const subNotes = { checkoutSessionId: 'sess-1', sku: 'STARTER_MONTHLY', userId: 'user-1' };

function body(event: string, payload: Record<string, unknown>) {
  return JSON.stringify({ event, payload });
}

function charged(paidCount: number) {
  return body('subscription.charged', {
    subscription: { entity: { id: 'sub_1', notes: subNotes, paid_count: paidCount } },
    payment: { entity: { id: `pay_${paidCount}`, amount: 11800, notes: [] } },
  });
}

describe('parseRazorpayWebhookEvent', () => {
  it('fulfils the checkout on the first subscription charge', () => {
    expect(parseRazorpayWebhookEvent(charged(1))).toMatchObject({
      type: 'checkout_completed',
      checkoutSessionId: 'sess-1',
      providerPaymentId: 'pay_1',
      providerSubscriptionId: 'sub_1',
    });
  });

  it('treats later charges as renewals even though notes still carry the session', () => {
    expect(parseRazorpayWebhookEvent(charged(2))).toMatchObject({
      type: 'renewal_paid',
      userId: 'user-1',
      providerPaymentId: 'pay_2',
      providerSubscriptionId: 'sub_1',
      sku: 'STARTER_MONTHLY',
    });
  });

  it('fulfils one-time orders from payment.captured', () => {
    const event = body('payment.captured', {
      payment: {
        entity: {
          id: 'pay_pro',
          amount: 1180000,
          notes: { checkoutSessionId: 'sess-pro', sku: 'PRO_LIFETIME', userId: 'user-1' },
        },
      },
    });
    expect(parseRazorpayWebhookEvent(event)).toMatchObject({
      type: 'checkout_completed',
      checkoutSessionId: 'sess-pro',
      sku: 'PRO_LIFETIME',
    });
  });

  it('ignores events that would double-fulfil or mislabel a payment', () => {
    const subscriptionCapture = body('payment.captured', {
      payment: { entity: { id: 'pay_1', amount: 11800, notes: subNotes } },
    });
    const activated = body('subscription.activated', {
      subscription: { entity: { id: 'sub_1', notes: subNotes } },
    });
    const failed = body('payment.failed', {
      payment: { entity: { id: 'pay_x', notes: { userId: 'user-1' } } },
    });
    expect(parseRazorpayWebhookEvent(subscriptionCapture)).toBeNull();
    expect(parseRazorpayWebhookEvent(activated)).toBeNull();
    expect(parseRazorpayWebhookEvent(failed)).toBeNull();
  });

  it('maps pending and halted subscriptions', () => {
    const sub = { subscription: { entity: { id: 'sub_1', notes: subNotes } } };
    expect(parseRazorpayWebhookEvent(body('subscription.pending', sub))).toMatchObject({
      type: 'payment_failed',
      userId: 'user-1',
    });
    expect(parseRazorpayWebhookEvent(body('subscription.halted', sub))).toMatchObject({
      type: 'subscription_halted',
      providerSubscriptionId: 'sub_1',
    });
  });
});

describe('verifyRazorpaySignature', () => {
  it('accepts only the exact HMAC', () => {
    const sig = createHmac('sha256', 'secret').update('payload').digest('hex');
    expect(verifyRazorpaySignature('payload', sig, 'secret')).toBe(true);
    expect(verifyRazorpaySignature('payload2', sig, 'secret')).toBe(false);
    expect(verifyRazorpaySignature('payload', 'short', 'secret')).toBe(false);
  });
});

describe('starterAccessEndsAt', () => {
  it('gives auto-renewing subscriptions a grace period but not canceled ones', () => {
    const end = new Date('2026-12-01T00:00:00.000Z');
    const graceMs = RENEWAL_GRACE_DAYS * 24 * 60 * 60 * 1000;
    expect(starterAccessEndsAt(PlanStatus.ACTIVE, end).getTime()).toBe(end.getTime() + graceMs);
    expect(starterAccessEndsAt(PlanStatus.CANCELED, end)).toEqual(end);
  });
});
