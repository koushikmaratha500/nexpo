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

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const d = dayjs(dateStr, 'DD-MM-YYYY', true).isValid()
    ? dayjs(dateStr, 'DD-MM-YYYY')
    : dayjs(dateStr);
  return d.toDate();
}

export function dateToInputFormat(date: string | number | Date | null | undefined): string {
  if (!date) return dayjs().format('YYYY-MM-DD');
  let d = dayjs(date);
  if (typeof date === 'string') {
    const parsed = dayjs(date, 'DD-MM-YYYY', true);
    if (parsed.isValid()) d = parsed;
  }
  return d.isValid() ? d.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
}
