import { PaymentProvider } from '@prisma/client';
import { RazorpayGateway } from './razorpay.gateway';
import { StripeGateway } from './stripe.gateway';
import type { PaymentGateway } from './types';

const razorpayGateway = new RazorpayGateway();
const stripeGateway = new StripeGateway();

export function getGateway(provider: PaymentProvider): PaymentGateway {
  return provider === PaymentProvider.RAZORPAY ? razorpayGateway : stripeGateway;
}

export function getConfiguredGateways(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];
  if (razorpayGateway.isConfigured()) providers.push(PaymentProvider.RAZORPAY);
  if (stripeGateway.isConfigured()) providers.push(PaymentProvider.STRIPE);
  return providers;
}

export { RazorpayGateway, StripeGateway };
export type * from './types';
