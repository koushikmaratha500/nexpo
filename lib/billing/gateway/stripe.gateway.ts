import Stripe from 'stripe';
import { BillingInterval, CheckoutSku, PaymentProvider } from '@prisma/client';
import { getSkuDefinition } from '../skus';
import type { BillingWebhookEvent } from '../webhook-events';
import type { CreateCheckoutInput, PaymentGateway } from './types';

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error('Stripe is not configured');
  }
  return new Stripe(secret);
}

function getPriceId(sku: CheckoutSku): string | undefined {
  if (sku === CheckoutSku.STARTER_MONTHLY) {
    return process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim();
  }
  if (sku === CheckoutSku.STARTER_YEARLY) {
    return process.env.STRIPE_PRICE_STARTER_YEARLY?.trim();
  }
  if (sku === CheckoutSku.PRO_LIFETIME) {
    return process.env.STRIPE_PRICE_PRO_LIFETIME?.trim();
  }
  return undefined;
}

function skuFromBillingInterval(interval: BillingInterval): CheckoutSku {
  return interval === BillingInterval.YEAR
    ? CheckoutSku.STARTER_YEARLY
    : CheckoutSku.STARTER_MONTHLY;
}

export class StripeGateway implements PaymentGateway {
  readonly provider = PaymentProvider.STRIPE;

  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  }

  async createCheckout(input: CreateCheckoutInput) {
    const stripe = getStripe();
    const skuDef = getSkuDefinition(input.sku);
    const priceId = getPriceId(input.sku);

    let customerId = input.customer.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: input.customer.email,
        name: input.customer.name,
        metadata: { userId: input.customer.userId },
      });
      customerId = customer.id;
    }

    const metadata = {
      checkoutSessionId: input.sessionId,
      sku: input.sku,
      userId: input.customer.userId,
    };

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.totalPaise,
            product_data: { name: skuDef.label },
            ...(skuDef.recurring
              ? {
                  recurring: {
                    interval: input.sku === CheckoutSku.STARTER_YEARLY ? 'year' : 'month',
                  },
                }
              : {}),
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      mode: skuDef.recurring ? 'subscription' : 'payment',
      customer: customerId,
      line_items: lineItems,
      success_url: `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl,
      metadata,
      subscription_data: skuDef.recurring ? { metadata } : undefined,
    });

    if (!session.url) {
      throw new Error('Stripe checkout session URL missing');
    }

    return {
      provider: PaymentProvider.STRIPE,
      providerSessionId: session.id,
      providerSubscriptionId:
        typeof session.subscription === 'string' ? session.subscription : undefined,
      stripeCustomerId: customerId,
      clientPayload: {
        kind: 'stripe' as const,
        sessionId: session.id,
        url: session.url,
      },
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    const stripe = getStripe();
    if (cancelAtPeriodEnd) {
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      return;
    }
    await stripe.subscriptions.cancel(subscriptionId);
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) return false;
    try {
      getStripe().webhooks.constructEvent(rawBody, signature, secret);
      return true;
    } catch {
      return false;
    }
  }

  async parseWebhookEvent(rawBody: string, signature: string): Promise<BillingWebhookEvent | null> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) return null;

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutSessionId = session.metadata?.checkoutSessionId;
      const sku = session.metadata?.sku as CheckoutSku | undefined;
      if (!checkoutSessionId || !sku) return null;

      const providerPaymentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.id;

      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : undefined;

      return {
        type: 'checkout_completed',
        provider: PaymentProvider.STRIPE,
        checkoutSessionId,
        providerPaymentId,
        providerSubscriptionId: subscriptionId,
        amountPaise: session.amount_total ?? 0,
        sku,
      };
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | null;
        payment_intent?: string | null;
        subscription_details?: { metadata?: Record<string, string> };
      };
      const subscriptionId =
        typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
      const metadata = invoice.subscription_details?.metadata ?? invoice.metadata ?? {};
      const checkoutSessionId = metadata.checkoutSessionId;
      const sku = metadata.sku as CheckoutSku | undefined;
      const userId = metadata.userId;

      if (checkoutSessionId && sku) {
        return {
          type: 'checkout_completed',
          provider: PaymentProvider.STRIPE,
          checkoutSessionId,
          providerPaymentId: invoice.payment_intent ? String(invoice.payment_intent) : invoice.id,
          providerSubscriptionId: subscriptionId,
          amountPaise: invoice.amount_paid ?? 0,
          sku,
        };
      }

      if (!subscriptionId) return null;

      return {
        type: 'renewal_paid',
        provider: PaymentProvider.STRIPE,
        userId,
        providerPaymentId: invoice.payment_intent ? String(invoice.payment_intent) : invoice.id,
        providerSubscriptionId: subscriptionId,
        amountPaise: invoice.amount_paid ?? 0,
        sku,
      };
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      return {
        type: 'subscription_canceled',
        provider: PaymentProvider.STRIPE,
        userId: subscription.metadata?.userId,
        providerSubscriptionId: subscription.id,
        immediate: true,
      };
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      if (!subscription.cancel_at_period_end) return null;
      return {
        type: 'subscription_canceled',
        provider: PaymentProvider.STRIPE,
        userId: subscription.metadata?.userId,
        providerSubscriptionId: subscription.id,
        immediate: false,
      };
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const subscriptionId =
        typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
      if (!subscriptionId) return null;
      return {
        type: 'payment_failed',
        provider: PaymentProvider.STRIPE,
        providerSubscriptionId: subscriptionId,
      };
    }

    return null;
  }
}

export { skuFromBillingInterval };
