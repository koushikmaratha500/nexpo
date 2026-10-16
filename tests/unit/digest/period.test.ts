import { describe, expect, it } from 'vitest';
import {
  getCalendarMonthBounds,
  getPreviousCalendarMonth,
  resolveDigestPeriod,
} from '@/lib/digest/period';

describe('digest period (Asia/Kolkata)', () => {
  it('previous month for Oct 1 2026 09:00 IST is September', () => {
    const ref = new Date('2026-10-01T03:30:00.000Z'); // 09:00 IST
    const period = getPreviousCalendarMonth(ref);
    expect(period.periodKey).toBe('2026-09');
    expect(period.label).toBe('September 2026');
  });

  it('uses inclusive start and exclusive end for September 2026', () => {
    const { start, end } = getCalendarMonthBounds(2026, 8);
    expect(start.toISOString()).toBe('2026-08-31T18:30:00.000Z');
    expect(end.toISOString()).toBe('2026-09-30T18:30:00.000Z');
  });

  it('handles January rollover to December prior year', () => {
    const ref = new Date('2026-01-01T03:30:00.000Z');
    const period = getPreviousCalendarMonth(ref);
    expect(period.periodKey).toBe('2025-12');
  });

  it('handles leap February via explicit period', () => {
    const period = resolveDigestPeriod('2024-02');
    const { start, end } = period;
    expect(period.periodKey).toBe('2024-02');
    expect(end.getTime() - start.getTime()).toBe(29 * 24 * 60 * 60 * 1000);
  });

  it('resolves previous_month alias', () => {
    const period = resolveDigestPeriod('previous_month', new Date('2026-11-01T03:30:00.000Z'));
    expect(period.periodKey).toBe('2026-10');
  });
});
