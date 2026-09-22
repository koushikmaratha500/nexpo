import { describe, expect, it } from 'vitest';
import { parseTransactionDate } from '@/lib/bot/dateRanges';

describe('parseTransactionDate', () => {
  it('parses YYYY-MM-DD to a Date object', () => {
    const date = parseTransactionDate('2026-09-18');
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(18);
  });

  it('returns today when value is empty', () => {
    const date = parseTransactionDate(undefined);
    expect(date).toBeInstanceOf(Date);
  });
});
