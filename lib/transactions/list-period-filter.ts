import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { Prisma } from '@prisma/client';
import { APP_TIMEZONE } from '@/lib/api/utils/app-timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export interface TransactionListDayBounds {
  startDay?: string;
  /** Inclusive last calendar day in {@link APP_TIMEZONE}. */
  endDay?: string;
}

/**
 * Filters on `transactionDate` using inclusive calendar days in product timezone.
 * Matches rows whose timestamp falls anywhere on startDay … endDay (local dates).
 */
export function buildTransactionDateDayFilter(
  startDay?: string,
  endDay?: string,
): Prisma.TransactionWhereInput | null {
  const start = startDay?.trim();
  const end = endDay?.trim();
  if (!start && !end) return null;
  if (start && !YMD.test(start)) return null;
  if (end && !YMD.test(end)) return null;

  const transactionDate: Prisma.DateTimeFilter = {};
  if (start) {
    transactionDate.gte = dayjs.tz(start, APP_TIMEZONE).startOf('day').toDate();
  }
  if (end) {
    transactionDate.lte = dayjs.tz(end, APP_TIMEZONE).endOf('day').toDate();
  }
  return { transactionDate };
}

/** Derive inclusive endDay from half-open endDayExclusive (YYYY-MM-DD). */
export function inclusiveEndDayFromExclusive(endDayExclusive: string): string | undefined {
  if (!YMD.test(endDayExclusive.trim())) return undefined;
  return dayjs.tz(endDayExclusive.trim(), APP_TIMEZONE).subtract(1, 'day').format('YYYY-MM-DD');
}

/** Normalize list query into calendar day bounds for transactionDate filtering. */
export function resolveTransactionListDayBounds(input: {
  startDay?: string;
  endDay?: string;
  endDayExclusive?: string;
  startDate?: Date;
  endExclusive?: Date;
}): TransactionListDayBounds {
  let startDay = input.startDay?.trim();
  let endDay = input.endDay?.trim();

  if (!startDay && input.startDate) {
    startDay = dayjs(input.startDate).tz(APP_TIMEZONE).format('YYYY-MM-DD');
  }
  if (!endDay && input.endDayExclusive) {
    endDay = inclusiveEndDayFromExclusive(input.endDayExclusive);
  }
  if (!endDay && input.endExclusive) {
    endDay = dayjs(input.endExclusive).tz(APP_TIMEZONE).subtract(1, 'millisecond').format('YYYY-MM-DD');
  }

  return {
    ...(startDay && YMD.test(startDay) ? { startDay } : {}),
    ...(endDay && YMD.test(endDay) ? { endDay } : {}),
  };
}
