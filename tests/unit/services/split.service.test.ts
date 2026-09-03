import { describe, expect, it } from 'vitest';
import { SplitService } from '@/lib/api/services/split.service';

describe('SplitService', () => {
  it('splits equally among included members and assigns penny remainder to payer', () => {
    const result = SplitService.calculate(
      'EQUAL_INCLUDED',
      100,
      [
        { userId: 'payer', included: true },
        { userId: 'u2', included: true },
        { userId: 'u3', included: true },
      ],
      'payer',
    );

    const total = result.reduce((sum, row) => sum + row.computedAmount, 0);
    expect(total).toBe(100);
    expect(result.find((row) => row.userId === 'payer')?.computedAmount).toBeCloseTo(33.34, 2);
    expect(result.find((row) => row.userId === 'u2')?.computedAmount).toBe(33.33);
  });

  it('excludes members from equal split denominator', () => {
    const result = SplitService.calculate(
      'EQUAL_INCLUDED',
      200,
      [
        { userId: 'payer', included: true },
        { userId: 'u2', included: true },
        { userId: 'u3', included: false },
      ],
      'payer',
    );

    expect(result.find((row) => row.userId === 'u3')?.computedAmount).toBe(0);
    expect(result.find((row) => row.userId === 'payer')?.computedAmount).toBe(100);
    expect(result.find((row) => row.userId === 'u2')?.computedAmount).toBe(100);
  });

  it('validates custom amount totals', () => {
    expect(() =>
      SplitService.calculate(
        'CUSTOM_AMOUNT',
        100,
        [
          { userId: 'u1', included: true, shareAmount: 40 },
          { userId: 'u2', included: true, shareAmount: 50 },
        ],
        'u1',
      ),
    ).toThrow('Custom split amounts must sum to the expense total');

    const result = SplitService.calculate(
      'CUSTOM_AMOUNT',
      100,
      [
        { userId: 'u1', included: true, shareAmount: 40 },
        { userId: 'u2', included: true, shareAmount: 60 },
      ],
      'u1',
    );

    expect(result.find((row) => row.userId === 'u1')?.computedAmount).toBe(40);
    expect(result.find((row) => row.userId === 'u2')?.computedAmount).toBe(60);
  });

  it('validates custom percent totals and adjusts payer for rounding', () => {
    expect(() =>
      SplitService.calculate(
        'CUSTOM_PERCENT',
        100,
        [
          { userId: 'u1', included: true, sharePercent: 40 },
          { userId: 'u2', included: true, sharePercent: 50 },
        ],
        'u1',
      ),
    ).toThrow('Custom split percents must sum to 100');

    const result = SplitService.calculate(
      'CUSTOM_PERCENT',
      100,
      [
        { userId: 'payer', included: true, sharePercent: 33.33 },
        { userId: 'u2', included: true, sharePercent: 33.33 },
        { userId: 'u3', included: true, sharePercent: 33.34 },
      ],
      'payer',
    );

    const total = result.reduce((sum, row) => sum + row.computedAmount, 0);
    expect(total).toBe(100);
  });

  it('requires at least one included participant', () => {
    expect(() =>
      SplitService.calculate(
        'EQUAL_INCLUDED',
        50,
        [
          { userId: 'u1', included: false },
          { userId: 'u2', included: false },
        ],
        'u1',
      ),
    ).toThrow('At least one group member must be included in the split');
  });
});
