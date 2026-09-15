import type { PlanEntitlement } from './types';
import { PLAN_ERROR_CODES } from './types';

export function shouldShowUpgradeCta(plan: PlanEntitlement | null | undefined): boolean {
  if (!plan) return false;
  if (plan.pricingEnabled === false) return false;
  return plan.plan === 'FREEMIUM' || plan.plan === 'STARTER';
}

export function isPlanLimitError(code?: string): boolean {
  return code === PLAN_ERROR_CODES.LIMIT || code === PLAN_ERROR_CODES.FEATURE;
}
