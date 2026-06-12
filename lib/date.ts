import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * Formats a date string, number, or Date object to 'DD-MM-YYYY'.
 * 
 * @param date The date to format.
 * @returns The formatted date string, or an empty string if invalid.
 */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('DD-MM-YYYY') : '';
}

/**
 * Formats a date string, number, or Date object to 24-hour timestamp 'DD-MM-YYYY HH:mm:ss'.
 * 
 * @param date The date to format.
 * @returns The formatted timestamp string, or an empty string if invalid.
 */
export function formatDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('DD-MM-YYYY HH:mm:ss') : '';
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
