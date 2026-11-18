import crypto from 'crypto';
import Razorpay from 'razorpay';
import { BillingInterval, CheckoutSku, PaymentProvider } from '@prisma/client';
import { getSkuDefinition, SKU_CATALOG } from '../skus';
import type { BillingWebhookEvent } from '../webhook-events';
import type { CreateCheckoutInput, PaymentGateway } from './types';

function getClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function getPlanId(sku: CheckoutSku): string | undefined {
  if (sku === CheckoutSku.STARTER_MONTHLY) {
    return process.env.RAZORPAY_PLAN_STARTER_MONTHLY?.trim();
  }
  if (sku === CheckoutSku.STARTER_YEARLY) {
    return process.env.RAZORPAY_PLAN_STARTER_YEARLY?.trim();
  }
  return undefined;
}

/** Constant-time check of a Razorpay HMAC-SHA256 hex signature over `payload`. */
export function verifyRazorpaySignature(payload: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(payload).digest('hex'));
  const provided = Buffer.from(signature ?? '');
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

function skuFromBillingInterval(interval: BillingInterval): CheckoutSku {
  return interval === BillingInterval.YEAR
    ? CheckoutSku.STARTER_YEARLY
    : CheckoutSku.STARTER_MONTHLY;
}

export class RazorpayGateway implements PaymentGateway {
  readonly provider = PaymentProvider.RAZORPAY;

  isConfigured(): boolean {
    return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
  }

  async createCheckout(input: CreateCheckoutInput) {
    const razorpay = getClient();
    const skuDef = getSkuDefinition(input.sku);
    const keyId = process.env.RAZORPAY_KEY_ID!.trim();
    const notes = {
      checkoutSessionId: input.sessionId,
      sku: input.sku,
      userId: input.customer.userId,
    };

    if (skuDef.recurring) {
      const planId = getPlanId(input.sku);
      if (!planId) {
        throw new Error(
          `Razorpay plan ID missing for ${input.sku}. Set RAZORPAY_PLAN_STARTER_MONTHLY / RAZORPAY_PLAN_STARTER_YEARLY.`,
        );
      }

      // Razorpay debits the plan's amount, not ours: refuse checkout if they disagree.
      const plan = await razorpay.plans.fetch(planId);
      const planAmount = Number(plan.item.amount);
      if (planAmount !== input.totalPaise || plan.item.currency !== input.currency) {
        console.error(
          `[billing] Razorpay plan ${planId} charges ${planAmount} ${plan.item.currency} but ${input.sku} costs ${input.totalPaise} ${input.currency} (incl. GST). Update the plan or the price.`,
        );
        throw new Error('Checkout is temporarily unavailable. Please try again later.');
      }

      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        // Number of billing cycles Razorpay will auto-debit: 10 years either way.
        total_count: input.sku === CheckoutSku.STARTER_YEARLY ? 10 : 120,
        customer_notify: 1,
        notes,
      });

      return {
        provider: PaymentProvider.RAZORPAY,
        providerSessionId: subscription.id,
        providerSubscriptionId: subscription.id,
        clientPayload: {
          kind: 'razorpay' as const,
          keyId,
          subscriptionId: subscription.id,
          amountPaise: input.totalPaise,
          currency: input.currency,
          name: 'PaysaSuchan',
          description: skuDef.label,
          prefill: { email: input.customer.email, name: input.customer.name },
          notes,
        },
      };
    }

    const order = await razorpay.orders.create({
      amount: input.totalPaise,
      currency: input.currency,
      notes,
    });

    return {
      provider: PaymentProvider.RAZORPAY,
      providerSessionId: order.id,
      clientPayload: {
        kind: 'razorpay' as const,
        keyId,
        orderId: order.id,
        amountPaise: input.totalPaise,
        currency: input.currency,
        name: 'PaysaSuchan',
        description: skuDef.label,
        prefill: { email: input.customer.email, name: input.customer.name },
        notes,
      },
    };
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    const razorpay = getClient();
    await razorpay.subscriptions.cancel(subscriptionId, cancelAtPeriodEnd);
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!secret) return false;
    return verifyRazorpaySignature(rawBody, signature, secret);
  }

  async parseWebhookEvent(rawBody: string): Promise<BillingWebhookEvent | null> {
    return parseRazorpayWebhookEvent(rawBody);
  }
}

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        notes?: Record<string, string> | unknown[];
      };
    };
    subscription?: {
      entity?: {
        id?: string;
        notes?: Record<string, string> | unknown[];
        paid_count?: number;
      };
    };
  };
}

/** Razorpay sends `notes: []` when empty. */
function notesOf(value: Record<string, string> | unknown[] | undefined): Record<string, string> {
  return value && !Array.isArray(value) ? value : {};
}

/**
 * Maps a verified Razorpay webhook to a billing event.
 * Subscriptions: only `subscription.charged` moves money (paid_count 1 = first checkout,
 * later = renewal). `payment.captured` handles one-time orders only, and
 * `subscription.activated` / `payment.failed` are ignored so one payment is never
 * fulfilled twice and a failed upgrade attempt never marks a Starter user past due.
 */
export function parseRazorpayWebhookEvent(rawBody: string): BillingWebhookEvent | null {
  const event = JSON.parse(rawBody) as RazorpayWebhookBody;
  const eventName = event.event ?? '';
  const payment = event.payload?.payment?.entity;
  const subscription = event.payload?.subscription?.entity;

  if (eventName === 'payment.captured') {
    const notes = notesOf(payment?.notes);
    const sku = notes.sku as CheckoutSku | undefined;
    if (!payment?.id || !notes.checkoutSessionId || !sku || !(sku in SKU_CATALOG)) return null;
    if (getSkuDefinition(sku).recurring) return null; // handled by subscription.charged
    return {
      type: 'checkout_completed',
      provider: PaymentProvider.RAZORPAY,
      checkoutSessionId: notes.checkoutSessionId,
      providerPaymentId: payment.id,
      amountPaise: payment.amount ?? 0,
      sku,
    };
  }

  if (eventName === 'subscription.charged') {
    if (!subscription?.id || !payment?.id) return null;
    const notes = notesOf(subscription.notes);
    const sku = notes.sku && notes.sku in SKU_CATALOG ? (notes.sku as CheckoutSku) : undefined;

    if ((subscription.paid_count ?? 1) <= 1 && notes.checkoutSessionId && sku) {
      return {
        type: 'checkout_completed',
        provider: PaymentProvider.RAZORPAY,
        checkoutSessionId: notes.checkoutSessionId,
        providerPaymentId: payment.id,
        providerSubscriptionId: subscription.id,
        amountPaise: payment.amount ?? 0,
        sku,
      };
    }

    return {
      type: 'renewal_paid',
      provider: PaymentProvider.RAZORPAY,
      userId: notes.userId,
      providerPaymentId: payment.id,
      providerSubscriptionId: subscription.id,
      amountPaise: payment.amount ?? 0,
      sku,
    };
  }

  if (!subscription?.id) return null;
  const userId = notesOf(subscription.notes).userId;

  if (eventName === 'subscription.pending') {
    return {
      type: 'payment_failed',
      provider: PaymentProvider.RAZORPAY,
      userId,
      providerSubscriptionId: subscription.id,
    };
  }

  if (eventName === 'subscription.halted') {
    return {
      type: 'subscription_halted',
      provider: PaymentProvider.RAZORPAY,
      userId,
      providerSubscriptionId: subscription.id,
    };
  }

  if (eventName === 'subscription.cancelled' || eventName === 'subscription.completed') {
    return {
      type: 'subscription_canceled',
      provider: PaymentProvider.RAZORPAY,
      userId,
      providerSubscriptionId: subscription.id,
      immediate: eventName === 'subscription.cancelled',
    };
  }

  return null;
}

export { skuFromBillingInterval };
