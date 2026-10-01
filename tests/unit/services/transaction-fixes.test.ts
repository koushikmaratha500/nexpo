import { describe, expect, it } from 'vitest';
import { firstRecurringScheduleMonthYm } from '@/lib/api/services/transaction.service';
import { isSameCalendarMonth, parseLocalDateInput, parseTransactionCalendarDate } from '@/lib/date';
import { isLedgerIncomeTransaction } from '@/lib/transactions/ledger';

describe('transaction field and dashboard date helpers', () => {
  it('parses YYYY-MM-DD as local calendar date', () => {
    const d = parseLocalDateInput('2025-10-15');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(15);
  });

  it('parses DD-MM-YYYY display dates for dashboard filters', () => {
    const d = parseTransactionCalendarDate('15-10-2025');
    expect(d?.getFullYear()).toBe(2025);
    expect(d?.getMonth()).toBe(9);
    expect(isSameCalendarMonth('15-10-2025', new Date(2025, 9, 20))).toBe(true);
    expect(isSameCalendarMonth('15-09-2025', new Date(2025, 9, 20))).toBe(false);
  });

  it('schedules recurring from the month after the template transaction month', () => {
    const oct = new Date(2025, 9, 28);
    const ym = firstRecurringScheduleMonthYm(oct);
    expect(ym).toBe(2025 * 12 + 10);
  });

  it('counts Salary as income even when legacy rows used DEBIT type', () => {
    expect(
      isLedgerIncomeTransaction({ type: 'DEBIT', category: 'Salary', categoryType: 'DEBIT' }),
    ).toBe(true);
    expect(isLedgerIncomeTransaction({ type: 'CREDIT', category: 'Refund' })).toBe(true);
    expect(isLedgerIncomeTransaction({ type: 'DEBIT', category: 'Food', categoryType: 'DEBIT' })).toBe(
      false,
    );
  });
});
