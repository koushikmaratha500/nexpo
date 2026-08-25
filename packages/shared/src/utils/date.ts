import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('DD-MM-YYYY') : '';
}

export function formatDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('DD-MM-YYYY HH:mm:ss') : '';
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
