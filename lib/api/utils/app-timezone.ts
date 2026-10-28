import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Product calendar timezone (aligned with monthly digest). */
export const APP_TIMEZONE = process.env.NEXPO_APP_TIMEZONE || 'Asia/Kolkata';

/** Seconds until the next local midnight in {@link APP_TIMEZONE}. */
export function secondsUntilNextMidnightInTz(now = new Date(), tz = APP_TIMEZONE): number {
  const nowTz = dayjs(now).tz(tz);
  const nextMidnight = nowTz.add(1, 'day').startOf('day');
  const secs = Math.ceil((nextMidnight.valueOf() - nowTz.valueOf()) / 1000);
  return Math.max(1, secs);
}

/** Inclusive calendar-day bounds as UTC instants: [start, endExclusive). */
export function calendarDayBoundsInTz(
  reference: Date,
  tz = APP_TIMEZONE,
): { start: Date; endExclusive: Date } {
  const start = dayjs(reference).tz(tz).startOf('day');
  return { start: start.toDate(), endExclusive: start.add(1, 'day').toDate() };
}

/** Calendar month bounds in timezone: [start, endExclusive). */
export function calendarMonthBoundsInTz(
  year: number,
  monthIndex0: number,
  tz = APP_TIMEZONE,
): { start: Date; endExclusive: Date } {
  const ymd = `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-01`;
  const start = dayjs.tz(ymd, tz).startOf('day');
  return { start: start.toDate(), endExclusive: start.add(1, 'month').toDate() };
}
