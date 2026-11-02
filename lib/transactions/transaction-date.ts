import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { APP_TIMEZONE } from '@/lib/api/utils/app-timezone';
import { parseLocalDateInput } from '@/lib/date';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Store personal ledger dates as start-of-day in {@link APP_TIMEZONE}.
 * Aligns DB values with admin/customer period filters (also IST-aware).
 */
export function normalizeTransactionDateForStorage(value: string | Date): Date {
  if (value instanceof Date) {
    return dayjs(value).tz(APP_TIMEZONE).startOf('day').toDate();
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return dayjs.tz(trimmed, APP_TIMEZONE).startOf('day').toDate();
  }
  return dayjs(parseLocalDateInput(trimmed)).tz(APP_TIMEZONE).startOf('day').toDate();
}
