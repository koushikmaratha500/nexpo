import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from '@/lib/date';
import {
  formatDate as sharedFormatDate,
  formatDateTime as sharedFormatDateTime,
} from '../../packages/shared/src/utils/date';

describe('app-wide date formats', () => {
  const afternoon = new Date(2026, 10, 23, 16, 5, 9);
  const morning = new Date(2026, 0, 2, 0, 30, 0);

  it('formats dates as YYYY-MM-DD', () => {
    expect(formatDate(afternoon)).toBe('2026-11-23');
    expect(formatDate('2026-01-02')).toBe('2026-01-02');
  });

  it('formats timestamps as YYYY-MM-DD hh-mm-ss AM/PM', () => {
    expect(formatDateTime(afternoon)).toBe('2026-11-23 04-05-09 PM');
    expect(formatDateTime(morning)).toBe('2026-01-02 12-30-00 AM');
  });

  it('returns empty string for missing or invalid input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDateTime('not a date')).toBe('');
  });

  it('keeps the mobile/shared copy in sync', () => {
    expect(sharedFormatDate(afternoon)).toBe(formatDate(afternoon));
    expect(sharedFormatDateTime(afternoon)).toBe(formatDateTime(afternoon));
  });
});
