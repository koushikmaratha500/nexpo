import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { APP_TIMEZONE } from '@/lib/api/utils/app-timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export type TransactionPeriodMode = 'day' | 'month' | 'ytd';

export interface ResolvedPeriodRange {
  mode: TransactionPeriodMode;
  /** Inclusive start instant (timezone-aware calendar boundary). */
  start: Date;
  /** Exclusive end instant for half-open filtering [start, endExclusive). */
  endExclusive: Date;
  label: string;
  /** YYYY-MM-DD anchor for day mode navigation */
  anchorDay?: string;
  /** YYYY-MM anchor for month mode navigation */
  anchorMonth?: string;
}

function formatYmd(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM-DD');
}

function formatYm(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM');
}

/**
 * Resolves browsing period bounds using product timezone calendar semantics.
 * `anchor` is interpreted in APP_TIMEZONE for day/month; YTD uses current year through today.
 */
export function resolveTransactionPeriodRange(
  mode: TransactionPeriodMode,
  anchor: Date = new Date(),
  tz = APP_TIMEZONE,
): ResolvedPeriodRange {
  const nowTz = dayjs(anchor).tz(tz);
  const todayTz = dayjs().tz(tz).startOf('day');

  if (mode === 'day') {
    const day = nowTz.startOf('day');
    const clamped = day.isAfter(todayTz) ? todayTz : day;
    return {
      mode,
      start: clamped.toDate(),
      endExclusive: clamped.add(1, 'day').toDate(),
      label: clamped.format('D MMMM YYYY'),
      anchorDay: formatYmd(clamped),
    };
  }

  if (mode === 'month') {
    const monthStart = nowTz.startOf('month');
    const monthEndExclusive = monthStart.add(1, 'month');
    return {
      mode,
      start: monthStart.toDate(),
      endExclusive: monthEndExclusive.toDate(),
      label: monthStart.format('MMMM YYYY'),
      anchorMonth: formatYm(monthStart),
    };
  }

  const yearStart = nowTz.startOf('year');
  const ytdEndExclusive = todayTz.add(1, 'day');
  return {
    mode,
    start: yearStart.toDate(),
    endExclusive: ytdEndExclusive.toDate(),
    label: `Year to date ${yearStart.year()}`,
    anchorMonth: formatYm(nowTz),
  };
}

export function shiftPeriodAnchor(
  mode: TransactionPeriodMode,
  anchor: Date,
  direction: -1 | 1,
  tz = APP_TIMEZONE,
): Date {
  const d = dayjs(anchor).tz(tz);
  if (mode === 'day') {
    const next = d.add(direction, 'day');
    const today = dayjs().tz(tz).startOf('day');
    if (next.isAfter(today)) return today.toDate();
    return next.toDate();
  }
  if (mode === 'month') {
    return d.add(direction, 'month').toDate();
  }
  return anchor;
}

/** ISO strings for API query params (start inclusive, endExclusive). */
export function periodRangeToQueryParams(range: ResolvedPeriodRange): {
  startDate: string;
  endExclusive: string;
} {
  return {
    startDate: range.start.toISOString(),
    endExclusive: range.endExclusive.toISOString(),
  };
}
