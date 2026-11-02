import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  buildTransactionDateDayFilter,
  inclusiveEndDayFromExclusive,
  resolveTransactionListDayBounds,
} from '@/lib/transactions/list-period-filter';
import { normalizeTransactionDateForStorage } from '@/lib/transactions/transaction-date';
import {
  periodRangeToQueryParams,
  resolveTransactionPeriodRange,
} from '@/lib/transactions/period-range';

dayjs.extend(utc);
dayjs.extend(timezone);

function isWithinFilter(stored: Date, startDay: string, endDay: string): boolean {
  const filter = buildTransactionDateDayFilter(startDay, endDay);
  const gte = filter!.transactionDate!.gte as Date;
  const lte = filter!.transactionDate!.lte as Date;
  return stored.getTime() >= gte.getTime() && stored.getTime() <= lte.getTime();
}

describe('transactionDate list period filter', () => {
  it('maps endDayExclusive to inclusive endDay', () => {
    expect(inclusiveEndDayFromExclusive('2026-11-01')).toBe('2026-10-31');
  });

  it('includes normalized storage date within October month bounds', () => {
    const stored = normalizeTransactionDateForStorage('2026-10-31');
    expect(isWithinFilter(stored, '2026-10-01', '2026-10-31')).toBe(true);
  });

  it('includes legacy UTC-midnight date within October month bounds', () => {
    const legacy = new Date('2026-10-15T00:00:00.000Z');
    expect(isWithinFilter(legacy, '2026-10-01', '2026-10-31')).toBe(true);
  });

  it('periodRangeToQueryParams yields inclusive endDay for month mode', () => {
    const range = resolveTransactionPeriodRange('month', new Date('2026-10-15T12:00:00'));
    const params = periodRangeToQueryParams(range);
    expect(params.startDay).toBe('2026-10-01');
    expect(params.endDay).toBe('2026-10-31');

    const stored = normalizeTransactionDateForStorage('2026-10-31');
    expect(isWithinFilter(stored, params.startDay, params.endDay)).toBe(true);
  });

  it('resolveTransactionListDayBounds accepts startDay + endDayExclusive', () => {
    const bounds = resolveTransactionListDayBounds({
      startDay: '2026-10-01',
      endDayExclusive: '2026-11-01',
    });
    expect(bounds).toEqual({ startDay: '2026-10-01', endDay: '2026-10-31' });
  });
});
