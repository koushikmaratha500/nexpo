import { toYmd } from '@/lib/ai/aggregates';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function resolveDateRange(period: string | null | undefined, reference = new Date()): DateRange {
  const today = startOfDay(reference);

  switch (period) {
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { startDate: startOfDay(y), endDate: endOfDay(y), label: 'Yesterday' };
    }
    case 'this_week': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: startOfDay(start), endDate: endOfDay(today), label: 'This week' };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: startOfDay(start), endDate: endOfDay(end), label: 'Last month' };
    }
    case 'this_month':
    default: {
      if (period === 'today' || !period) {
        return { startDate: startOfDay(today), endDate: endOfDay(today), label: 'Today' };
      }
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: startOfDay(start), endDate: endOfDay(today), label: 'This month' };
    }
  }
}

/** Converts YYYY-MM-DD or ISO strings to a Date Prisma accepts. */
export function parseTransactionDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;

  const trimmed = value.trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]) - 1;
    const day = Number(ymd[3]);
    return new Date(year, month, day, 12, 0, 0, 0);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDateLabel(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const today = toYmd(new Date());
  const ymd = toYmd(d);
  if (ymd === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (ymd === toYmd(yesterday)) return 'Yesterday';
  return ymd;
}
