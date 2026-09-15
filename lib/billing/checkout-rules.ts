import { BillingInterval, BillingPlan, CheckoutSku, PlanStatus } from '@prisma/client';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { getSkuDefinition } from './skus';

export interface CheckoutUserState {
  plan: BillingPlan;
  planStatus: PlanStatus;
  billingInterval: BillingInterval;
  currentPeriodEndsAt: Date | null;
}

export function isStarterSubscriptionActive(user: CheckoutUserState, now = new Date()): boolean {
  return (
    user.plan === BillingPlan.STARTER &&
    user.currentPeriodEndsAt !== null &&
    user.currentPeriodEndsAt.getTime() > now.getTime() &&
    (user.planStatus === PlanStatus.ACTIVE ||
      user.planStatus === PlanStatus.PAST_DUE ||
      user.planStatus === PlanStatus.CANCELED)
  );
}

export function validateCheckoutSku(user: CheckoutUserState, sku: CheckoutSku, now = new Date()): void {
  const skuDef = getSkuDefinition(sku);

  if (user.plan === BillingPlan.PRO) {
    throw new HttpError(400, 'You already have Pro lifetime access.');
  }

  if (isStarterSubscriptionActive(user, now) && skuDef.plan === BillingPlan.STARTER) {
    throw new HttpError(
      400,
      user.billingInterval === skuDef.billingInterval
        ? 'You already have an active Starter subscription on this billing cycle.'
        : 'Finish or cancel your current Starter period before switching monthly/yearly billing.',
    );
  }
}
