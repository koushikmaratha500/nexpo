import { BillingInterval, BillingPlan, CheckoutSku } from '@prisma/client';
import { PLAN_PRICES_INR } from './catalog';
import { inrToPaise } from './config';

export interface SkuDefinition {
  sku: CheckoutSku;
  label: string;
  plan: BillingPlan;
  billingInterval: BillingInterval;
  subtotalPaise: number;
  recurring: boolean;
}

export const SKU_CATALOG: Record<CheckoutSku, SkuDefinition> = {
  STARTER_MONTHLY: {
    sku: CheckoutSku.STARTER_MONTHLY,
    label: 'Starter (Monthly)',
    plan: BillingPlan.STARTER,
    billingInterval: BillingInterval.MONTH,
    subtotalPaise: inrToPaise(PLAN_PRICES_INR.starterMonthly),
    recurring: true,
  },
  STARTER_YEARLY: {
    sku: CheckoutSku.STARTER_YEARLY,
    label: 'Starter (Yearly)',
    plan: BillingPlan.STARTER,
    billingInterval: BillingInterval.YEAR,
    subtotalPaise: inrToPaise(PLAN_PRICES_INR.starterYearly),
    recurring: true,
  },
  PRO_LIFETIME: {
    sku: CheckoutSku.PRO_LIFETIME,
    label: 'Pro (Lifetime)',
    plan: BillingPlan.PRO,
    billingInterval: BillingInterval.LIFETIME,
    subtotalPaise: inrToPaise(PLAN_PRICES_INR.proLifetime),
    recurring: false,
  },
};

export function getSkuDefinition(sku: CheckoutSku): SkuDefinition {
  return SKU_CATALOG[sku];
}

export function parseCheckoutSku(value: string): CheckoutSku | null {
  if (value in SKU_CATALOG) {
    return value as CheckoutSku;
  }
  return null;
}
