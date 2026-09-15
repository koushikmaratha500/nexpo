import { describe, expect, it } from 'vitest';
import { isPlanLimitError, shouldShowUpgradeCta } from '@/lib/billing/planUi';
import { PLAN_ERROR_CODES } from '@/lib/billing/types';

describe('shouldShowUpgradeCta', () => {
  it('shows upgrade for freemium and starter users', () => {
    expect(shouldShowUpgradeCta({ plan: 'FREEMIUM' } as never)).toBe(true);
    expect(shouldShowUpgradeCta({ plan: 'STARTER' } as never)).toBe(true);
  });

  it('hides upgrade for pro users', () => {
    expect(shouldShowUpgradeCta({ plan: 'PRO' } as never)).toBe(false);
    expect(shouldShowUpgradeCta(null)).toBe(false);
  });

  it('hides upgrade when pricing is disabled', () => {
    expect(shouldShowUpgradeCta({ plan: 'FREEMIUM', pricingEnabled: false } as never)).toBe(false);
    expect(shouldShowUpgradeCta({ plan: 'STARTER', pricingEnabled: false } as never)).toBe(false);
  });
});

describe('isPlanLimitError', () => {
  it('detects limit and feature plan errors', () => {
    expect(isPlanLimitError(PLAN_ERROR_CODES.LIMIT)).toBe(true);
    expect(isPlanLimitError(PLAN_ERROR_CODES.FEATURE)).toBe(true);
    expect(isPlanLimitError(PLAN_ERROR_CODES.WRITE_LOCKED)).toBe(false);
  });
});
