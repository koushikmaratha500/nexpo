import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { DigestPeriod, DigestPeriodInput } from './types';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = 'Asia/Kolkata';

/** Calendar month bounds in timezone: [start, end) as UTC instants. */
export function getCalendarMonthBounds(
  year: number,
  monthIndex0: number,
  tz = DEFAULT_TZ,
): { start: Date; end: Date } {
  const ymd = `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-01`;
  const start = dayjs.tz(ymd, tz).startOf('day');
  const end = start.add(1, 'month');
  return { start: start.toDate(), end: end.toDate() };
}

export function getPreviousCalendarMonth(
  referenceDate: Date = new Date(),
  tz = DEFAULT_TZ,
): DigestPeriod {
  const ref = dayjs(referenceDate).tz(tz);
  const prev = ref.subtract(1, 'month');
  const year = prev.year();
  const month = prev.month();
  const { start, end } = getCalendarMonthBounds(year, month, tz);
  const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const label = prev.format('MMMM YYYY');
  return { periodKey, start, end, label };
}

export function resolveDigestPeriod(
  input: DigestPeriodInput,
  referenceDate: Date = new Date(),
  tz = DEFAULT_TZ,
): DigestPeriod {
  if (input === 'previous_month') {
    return getPreviousCalendarMonth(referenceDate, tz);
  }
  const match = /^(\d{4})-(\d{2})$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid digest period: ${input}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (month < 0 || month > 11) {
    throw new Error(`Invalid digest period month: ${input}`);
  }
  const { start, end } = getCalendarMonthBounds(year, month, tz);
  const label = dayjs.tz(`${year}-${String(month + 1).padStart(2, '0')}-01`, tz).format('MMMM YYYY');
  return { periodKey: input.trim(), start, end, label };
}

export function getPriorPeriod(period: DigestPeriod, tz = DEFAULT_TZ): DigestPeriod {
  const [y, m] = period.periodKey.split('-').map((p) => Number(p));
  const d = dayjs.tz(`${y}-${String(m).padStart(2, '0')}-01`, tz).subtract(1, 'month');
  const { start, end } = getCalendarMonthBounds(d.year(), d.month(), tz);
  return {
    periodKey: d.format('YYYY-MM'),
    start,
    end,
    label: d.format('MMMM YYYY'),
  };
}
