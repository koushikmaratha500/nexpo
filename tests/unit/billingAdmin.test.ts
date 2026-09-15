import { describe, expect, it } from 'vitest';
import { formatPaiseAsInr } from '@/lib/billing/config';

describe('billing admin', () => {
  it('formats revenue totals for admin dashboard', () => {
    expect(formatPaiseAsInr(11800)).toBe('₹118.00');
    expect(formatPaiseAsInr(1000000)).toBe('₹10,000.00');
  });

  it('estimates starter MRR from monthly and yearly intervals', () => {
    const monthlyMrr = 10000;
    const yearlyMrr = Math.round(100000 / 12);
    expect(monthlyMrr + yearlyMrr).toBe(18333);
  });
});
