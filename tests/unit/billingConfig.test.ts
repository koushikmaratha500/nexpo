import { describe, expect, it } from 'vitest';
import { computeGstBreakdown, inrToPaise } from '@/lib/billing/config';
import { getSkuDefinition } from '@/lib/billing/skus';
import { CheckoutSku } from '@prisma/client';

describe('billing config', () => {
  it('computes 18% IGST by default', () => {
    const subtotal = inrToPaise(100);
    const breakdown = computeGstBreakdown(subtotal);
    expect(breakdown.gstPaise).toBe(1800);
    expect(breakdown.igstPaise).toBe(1800);
    expect(breakdown.totalPaise).toBe(11800);
  });

  it('maps SKUs to plan prices', () => {
    expect(getSkuDefinition(CheckoutSku.STARTER_MONTHLY).subtotalPaise).toBe(10000);
    expect(getSkuDefinition(CheckoutSku.STARTER_YEARLY).subtotalPaise).toBe(100000);
    expect(getSkuDefinition(CheckoutSku.PRO_LIFETIME).subtotalPaise).toBe(1000000);
  });
});
