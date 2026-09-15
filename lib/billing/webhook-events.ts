import type { CheckoutSku, PaymentProvider } from '@prisma/client';

export interface CheckoutFulfillmentEvent {
  type: 'checkout_completed';
  provider: PaymentProvider;
  checkoutSessionId: string;
  providerPaymentId: string;
  providerSubscriptionId?: string;
  amountPaise: number;
  sku: CheckoutSku;
}

export interface RenewalPaidEvent {
  type: 'renewal_paid';
  provider: PaymentProvider;
  userId?: string;
  providerPaymentId: string;
  providerSubscriptionId: string;
  amountPaise: number;
  sku?: CheckoutSku;
}

export interface SubscriptionCanceledEvent {
  type: 'subscription_canceled';
  provider: PaymentProvider;
  userId?: string;
  providerSubscriptionId: string;
  immediate: boolean;
}

export interface PaymentFailedEvent {
  type: 'payment_failed';
  provider: PaymentProvider;
  userId?: string;
  providerSubscriptionId?: string;
}

export type BillingWebhookEvent =
  | CheckoutFulfillmentEvent
  | RenewalPaidEvent
  | SubscriptionCanceledEvent
  | PaymentFailedEvent;
