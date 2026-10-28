import { TransactionRepository } from '../repositories/transaction.repository';
import { currentMonthLabel, monthRangeFromYm } from '../utils/month-range';
import { mapDbTransactionToClient } from '@/lib/transactions/map-client-transaction';
import {
  isLedgerExpenseTransaction,
  isLedgerIncomeTransaction,
} from '@/lib/transactions/ledger';
import { sumPersonalLedgerTotals } from '@/lib/transactions/ledger-totals';
import { parseTransactionCalendarDate } from '@/lib/date';
import { calendarDayBoundsInTz } from '../utils/app-timezone';
import type { CustomerDashboardPayload } from '../domain/customer-dashboard';
import {
  getCachedUserDashboard,
  invalidateUserDashboardCache,
  setCachedUserDashboard,
} from './dashboard-cache.service';

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: 'bg-secondary',
  RENT: 'bg-primary',
  TRAVEL: 'bg-outline-variant',
  UTILITIES: 'bg-surface-variant',
  SOFTWARE: 'bg-tertiary',
  MARKETING: 'bg-error',
};

export type { CustomerDashboardPayload } from '../domain/customer-dashboard';
export { invalidateUserDashboardCache };

export class DashboardService {
  static async getCustomerDashboard(userId: string, monthYm?: string): Promise<CustomerDashboardPayload> {
    const month = monthYm ?? currentMonthLabel();

    const cached = await getCachedUserDashboard(userId);
    if (cached && cached.month === month) {
      return cached;
    }

    const payload = await this.computeCustomerDashboard(userId, month);
    try {
      await setCachedUserDashboard(userId, payload);
    } catch (error) {
      console.warn('[dashboard] Failed to write cache for user', userId, error);
    }
    return payload;
  }

  private static async computeCustomerDashboard(
    userId: string,
    month: string,
  ): Promise<CustomerDashboardPayload> {
    const range = monthRangeFromYm(month);
    if (!range) {
      throw new Error('Invalid month');
    }

    const todayBounds = calendarDayBoundsInTz(new Date());

    const [allTimeRows, todayRows, monthRows] = await Promise.all([
      TransactionRepository.findPersonalLedgerRows(userId),
      TransactionRepository.findPersonalLedgerRows(userId, {
        start: todayBounds.start,
        endExclusive: todayBounds.endExclusive,
      }),
      TransactionRepository.findPersonalInDateRange(userId, range.start, range.end),
    ]);

    const allTimeTotals = sumPersonalLedgerTotals(
      allTimeRows.map((row) => ({
        type: row.type,
        amount: row.amount,
        category: row.category?.name ?? null,
        categoryType: row.category?.type ?? null,
      })),
    );

    const todayTotals = sumPersonalLedgerTotals(
      todayRows.map((row) => ({
        type: row.type,
        amount: row.amount,
        category: row.category?.name ?? null,
        categoryType: row.category?.type ?? null,
      })),
    );

    const transactions = monthRows.map((row) =>
      mapDbTransactionToClient(row as unknown as Record<string, unknown>),
    );

    const expenses = transactions.filter((t) => isLedgerExpenseTransaction(t));
    const credits = transactions.filter((t) => isLedgerIncomeTransaction(t));

    const monthSpend = expenses.reduce((sum, item) => sum + item.amount, 0);

    const daysInMonth = new Date(range.start.getFullYear(), range.start.getMonth() + 1, 0).getDate();
    const labels: string[] = [];
    const incomeAmounts: number[] = [];
    const expenseAmounts: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      labels.push(String(day));
      const dayExp = expenses
        .filter((e) => parseTransactionCalendarDate(e.date)?.getDate() === day)
        .reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0);
      expenseAmounts.push(dayExp);
      const dayCred = credits
        .filter((c) => parseTransactionCalendarDate(c.date)?.getDate() === day)
        .reduce((sum, c) => sum + (Number.isFinite(c.amount) ? c.amount : 0), 0);
      incomeAmounts.push(dayCred);
    }

    const categoryGroups: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category || 'Other';
      categoryGroups[cat] = (categoryGroups[cat] || 0) + e.amount;
    }

    const categoryBreakdown = Object.entries(categoryGroups)
      .map(([name, amount]) => {
        const pct = monthSpend > 0 ? Math.round((amount / monthSpend) * 100) : 0;
        return {
          name,
          percentage: pct,
          color: CATEGORY_COLORS[name] || 'bg-surface-variant',
        };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    const recentTransactions = [...transactions]
      .sort((a, b) => {
        const aTime = parseTransactionCalendarDate(a.date)?.getTime() ?? 0;
        const bTime = parseTransactionCalendarDate(b.date)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 3);

    return {
      month,
      totalSpend: allTimeTotals.totalExpenses,
      todaySpend: todayTotals.totalExpenses,
      totalDeposits: allTimeTotals.totalDeposits,
      chart: { labels, income: incomeAmounts, expenses: expenseAmounts },
      categoryBreakdown,
      recentTransactions,
    };
  }
}
