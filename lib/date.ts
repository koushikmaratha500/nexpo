import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/** App-wide display formats. Keep in sync with lib/date.ts and packages/shared/src/utils/date.ts. */
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_TIME_FORMAT = 'YYYY-MM-DD hh-mm-ss A';

/** Date only, e.g. `2026-11-23`. Empty string for missing or invalid input. */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format(DATE_FORMAT) : '';
}

/** Timestamp, e.g. `2026-11-23 04-05-09 PM`. Empty string for missing or invalid input. */
export function formatDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format(DATE_TIME_FORMAT) : '';
}

/**
 * Parses a date string (supporting 'DD-MM-YYYY' format) into a standard Javascript Date object.
 * 
 * @param dateStr The date string to parse.
 * @returns A Javascript Date object.
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const d = dayjs(dateStr, 'DD-MM-YYYY', true).isValid()
    ? dayjs(dateStr, 'DD-MM-YYYY')
    : dayjs(dateStr);
  return d.toDate();
}

/** Parse HTML date input (`YYYY-MM-DD`) as local calendar date (avoids UTC midnight drift). */
export function parseLocalDateInput(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map((part) => Number.parseInt(part, 10));
    return new Date(year, month - 1, day);
  }
  return parseDate(trimmed);
}

/** Parse ledger display dates (`DD-MM-YYYY`, ISO, or `YYYY-MM-DD`) for dashboards and charts. */
export function parseTransactionCalendarDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const ddmmyyyy = dayjs(dateStr, 'DD-MM-YYYY', true);
  if (ddmmyyyy.isValid()) return ddmmyyyy.toDate();
  const ymd = dayjs(dateStr, 'YYYY-MM-DD', true);
  if (ymd.isValid()) return ymd.toDate();
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.toDate() : null;
}

export function isSameCalendarMonth(dateStr: string, reference = new Date()): boolean {
  const d = parseTransactionCalendarDate(dateStr);
  if (!d) return false;
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth();
}

/**
 * Converts any date representation (including DD-MM-YYYY formatted string)
 * to 'YYYY-MM-DD' format required by HTML5 date inputs.
 * 
 * @param date The date representation.
 * @returns 'YYYY-MM-DD' formatted string, or today's date in local time if invalid.
 */
export function dateToInputFormat(date: string | number | Date | null | undefined): string {
  if (!date) return new Date().toLocaleDateString('sv-SE');
  let d = dayjs(date);
  
  if (typeof date === 'string') {
    const parsed = dayjs(date, 'DD-MM-YYYY', true);
    if (parsed.isValid()) {
      d = parsed;
    }
  }
  
  return d.isValid() ? d.format('YYYY-MM-DD') : new Date().toLocaleDateString('sv-SE');
}
