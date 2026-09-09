import crypto from 'crypto';
import Razorpay from 'razorpay';
import { BillingInterval, CheckoutSku, PaymentProvider } from '@prisma/client';
import { getSkuDefinition } from '../skus';
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

      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: input.sku === CheckoutSku.STARTER_YEARLY ? 1 : 120,
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
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return expected === signature;
  }

  async parseWebhookEvent(rawBody: string, _signature: string): Promise<BillingWebhookEvent | null> {
    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            amount?: number;
            notes?: Record<string, string>;
            status?: string;
            subscription_id?: string;
          };
        };
        subscription?: {
          entity?: {
            id?: string;
            notes?: Record<string, string>;
            status?: string;
          };
        };
      };
    };

    const eventName = event.event ?? '';

    if (eventName === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      const notes = payment?.notes ?? {};
      const checkoutSessionId = notes.checkoutSessionId;
      const sku = notes.sku as CheckoutSku | undefined;
      const userId = notes.userId;
      if (!payment?.id) return null;

      if (checkoutSessionId && sku) {
        return {
          type: 'checkout_completed',
          provider: PaymentProvider.RAZORPAY,
          checkoutSessionId,
          providerPaymentId: payment.id,
          amountPaise: payment.amount ?? 0,
          sku,
        };
      }

      if (userId && payment.subscription_id) {
        return {
          type: 'renewal_paid',
          provider: PaymentProvider.RAZORPAY,
          userId,
          providerPaymentId: payment.id,
          providerSubscriptionId: payment.subscription_id,
          amountPaise: payment.amount ?? 0,
          sku: sku ?? CheckoutSku.STARTER_MONTHLY,
        };
      }

      return null;
    }

    if (eventName === 'subscription.activated' || eventName === 'subscription.charged') {
      const subscription = event.payload?.subscription?.entity;
      const payment = event.payload?.payment?.entity;
      const notes = subscription?.notes ?? payment?.notes ?? {};
      const checkoutSessionId = notes.checkoutSessionId;
      const sku = notes.sku as CheckoutSku | undefined;
      const userId = notes.userId;
      const providerPaymentId = payment?.id ?? subscription?.id ?? '';
      if (!providerPaymentId) return null;

      if (checkoutSessionId && sku) {
        return {
          type: 'checkout_completed',
          provider: PaymentProvider.RAZORPAY,
          checkoutSessionId,
          providerPaymentId,
          providerSubscriptionId: subscription?.id,
          amountPaise: payment?.amount ?? 0,
          sku,
        };
      }

      if (userId && subscription?.id) {
        return {
          type: 'renewal_paid',
          provider: PaymentProvider.RAZORPAY,
          userId,
          providerPaymentId,
          providerSubscriptionId: subscription.id,
          amountPaise: payment?.amount ?? 0,
          sku: sku ?? CheckoutSku.STARTER_MONTHLY,
        };
      }

      return null;
    }

    if (eventName === 'subscription.cancelled' || eventName === 'subscription.completed') {
      const subscription = event.payload?.subscription?.entity;
      const notes = subscription?.notes ?? {};
      const userId = notes.userId;
      if (!userId || !subscription?.id) return null;
      return {
        type: 'subscription_canceled',
        provider: PaymentProvider.RAZORPAY,
        userId,
        providerSubscriptionId: subscription.id,
        immediate: eventName === 'subscription.cancelled',
      };
    }

    if (eventName === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const notes = payment?.notes ?? {};
      const userId = notes.userId;
      if (!userId) return null;
      return {
        type: 'payment_failed',
        provider: PaymentProvider.RAZORPAY,
        userId,
        providerSubscriptionId: payment?.subscription_id,
      };
    }

    return null;
  }
}

export { skuFromBillingInterval };
