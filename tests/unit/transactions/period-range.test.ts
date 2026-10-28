import { describe, it, expect } from 'vitest';
import {
  resolveTransactionPeriodRange,
  shiftPeriodAnchor,
} from '@/lib/transactions/period-range';

describe('resolveTransactionPeriodRange', () => {
  it('defaults month mode to full calendar month bounds', () => {
    const anchor = new Date('2026-10-15T12:00:00');
    const range = resolveTransactionPeriodRange('month', anchor);
    expect(range.label).toContain('October');
    expect(range.endExclusive.getTime()).toBeGreaterThan(range.start.getTime());
  });

  it('day mode uses single-day half-open interval', () => {
    const anchor = new Date('2026-03-10T08:00:00');
    const range = resolveTransactionPeriodRange('day', anchor);
    const hours = (range.endExclusive.getTime() - range.start.getTime()) / (1000 * 60 * 60);
    expect(hours).toBeGreaterThan(23);
    expect(hours).toBeLessThanOrEqual(24);
  });

  it('ytd spans from January through today', () => {
    const anchor = new Date('2026-06-15T10:00:00');
    const range = resolveTransactionPeriodRange('ytd', anchor);
    expect(range.label).toContain('2026');
    expect(range.start.getMonth()).toBe(0);
  });

  it('shiftPeriodAnchor moves day anchor without exceeding today', () => {
    const today = new Date();
    const prev = shiftPeriodAnchor('day', today, -1);
    const range = resolveTransactionPeriodRange('day', prev);
    expect(range.start.getTime()).toBeLessThanOrEqual(today.getTime());
  });
});
