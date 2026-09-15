import { describe, expect, it } from 'vitest';
import {
  BillingInterval,
  BillingPlan,
  CheckoutSku,
  PlanStatus,
} from '@prisma/client';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { isStarterSubscriptionActive, validateCheckoutSku } from '@/lib/billing/checkout-rules';

const future = new Date('2026-12-01T00:00:00.000Z');
const past = new Date('2026-01-01T00:00:00.000Z');

describe('checkout rules', () => {
  it('blocks checkout when user already has Pro', () => {
    expect(() =>
      validateCheckoutSku(
        {
          plan: BillingPlan.PRO,
          planStatus: PlanStatus.ACTIVE,
          billingInterval: BillingInterval.LIFETIME,
          currentPeriodEndsAt: null,
        },
        CheckoutSku.PRO_LIFETIME,
        future,
      ),
    ).toThrow(HttpError);
  });

  it('blocks duplicate Starter monthly checkout', () => {
    expect(() =>
      validateCheckoutSku(
        {
          plan: BillingPlan.STARTER,
          planStatus: PlanStatus.ACTIVE,
          billingInterval: BillingInterval.MONTH,
          currentPeriodEndsAt: future,
        },
        CheckoutSku.STARTER_MONTHLY,
        new Date('2026-06-01T00:00:00.000Z'),
      ),
    ).toThrow(/active Starter subscription/i);
  });

  it('allows Starter to upgrade to Pro lifetime', () => {
    expect(() =>
      validateCheckoutSku(
        {
          plan: BillingPlan.STARTER,
          planStatus: PlanStatus.ACTIVE,
          billingInterval: BillingInterval.MONTH,
          currentPeriodEndsAt: future,
        },
        CheckoutSku.PRO_LIFETIME,
        new Date('2026-06-01T00:00:00.000Z'),
      ),
    ).not.toThrow();
  });

  it('detects active Starter subscriptions', () => {
    expect(
      isStarterSubscriptionActive(
        {
          plan: BillingPlan.STARTER,
          planStatus: PlanStatus.CANCELED,
          billingInterval: BillingInterval.YEAR,
          currentPeriodEndsAt: future,
        },
        new Date('2026-06-01T00:00:00.000Z'),
      ),
    ).toBe(true);

    expect(
      isStarterSubscriptionActive(
        {
          plan: BillingPlan.STARTER,
          planStatus: PlanStatus.EXPIRED,
          billingInterval: BillingInterval.MONTH,
          currentPeriodEndsAt: past,
        },
        new Date('2026-06-01T00:00:00.000Z'),
      ),
    ).toBe(false);
  });
});
