export const PLAN_ERROR_CODES = {
  WRITE_LOCKED: 'PLAN_WRITE_LOCKED',
  LIMIT: 'PLAN_LIMIT',
  FEATURE: 'PLAN_FEATURE',
} as const;

export function shouldShowUpgradeCta(
  plan: { plan: string; pricingEnabled?: boolean } | null | undefined,
): boolean {
  if (!plan) return false;
  if (plan.pricingEnabled === false) return false;
  return plan.plan === 'FREEMIUM' || plan.plan === 'STARTER';
}

export function isPlanLimitError(code?: string): boolean {
  return code === PLAN_ERROR_CODES.LIMIT || code === PLAN_ERROR_CODES.FEATURE;
}
