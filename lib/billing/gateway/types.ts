import type { CheckoutSku, PaymentProvider } from '@prisma/client';
import type { BillingWebhookEvent } from '../webhook-events';

export interface CheckoutCustomer {
  userId: string;
  email: string;
  name: string;
  razorpayCustomerId?: string | null;
  stripeCustomerId?: string | null;
}

export interface CreateCheckoutInput {
  sessionId: string;
  sku: CheckoutSku;
  subtotalPaise: number;
  gstPaise: number;
  totalPaise: number;
  currency: string;
  customer: CheckoutCustomer;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  provider: PaymentProvider;
  providerSessionId: string;
  providerSubscriptionId?: string;
  clientPayload: RazorpayClientPayload | StripeClientPayload;
  expiresAt?: Date;
  stripeCustomerId?: string;
}

export interface RazorpayClientPayload {
  kind: 'razorpay';
  keyId: string;
  orderId?: string;
  subscriptionId?: string;
  amountPaise: number;
  currency: string;
  name: string;
  description: string;
  prefill: { email: string; name: string };
  notes: Record<string, string>;
}

export interface StripeClientPayload {
  kind: 'stripe';
  sessionId: string;
  url: string;
}

/** @deprecated Use BillingWebhookEvent */
export interface WebhookFulfillment {
  checkoutSessionId: string;
  providerPaymentId: string;
  providerSubscriptionId?: string;
  amountPaise: number;
  sku: CheckoutSku;
  succeeded: boolean;
}

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  isConfigured(): boolean;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSessionResult>;
  cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<void>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  parseWebhookEvent(rawBody: string, signature: string): Promise<BillingWebhookEvent | null>;
}
