import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '@/lib/api/services/dashboard.service';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';
import * as dashboardCache from '@/lib/api/services/dashboard-cache.service';

vi.mock('@/lib/api/repositories/transaction.repository', () => ({
  TransactionRepository: {
    findPersonalInDateRange: vi.fn(),
    findPersonalLedgerRows: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/dashboard-cache.service', () => ({
  getCachedUserDashboard: vi.fn(),
  setCachedUserDashboard: vi.fn(),
  invalidateUserDashboardCache: vi.fn(),
}));

describe('DashboardService.getCustomerDashboard', () => {
  beforeEach(() => {
    vi.mocked(TransactionRepository.findPersonalInDateRange).mockReset();
    vi.mocked(TransactionRepository.findPersonalLedgerRows).mockReset();
    vi.mocked(dashboardCache.getCachedUserDashboard).mockReset();
    vi.mocked(dashboardCache.setCachedUserDashboard).mockReset();
    vi.mocked(dashboardCache.getCachedUserDashboard).mockResolvedValue(null);
  });

  it('aggregates all-time totals separately from month chart data', async () => {
    vi.mocked(TransactionRepository.findPersonalLedgerRows).mockImplementation(async (_userId, range) => {
      if (range?.start && range?.endExclusive) {
        return [{ type: 'DEBIT', amount: 50, category: { name: 'FOOD', type: 'DEBIT' } }] as never;
      }
      return [
        { type: 'DEBIT', amount: 100, category: { name: 'FOOD', type: 'DEBIT' } },
        { type: 'CREDIT', amount: 5000, category: { name: 'Salary', type: 'CREDIT' } },
      ] as never;
    });

    vi.mocked(TransactionRepository.findPersonalInDateRange).mockResolvedValue([
      {
        id: '1',
        type: 'DEBIT',
        title: 'Coffee',
        amount: 100,
        transactionDate: new Date(2026, 9, 15),
        category: { name: 'FOOD', code: 'FOOD', type: 'DEBIT' },
        currency: { code: 'INR' },
        paymentType: { name: 'Card' },
      },
    ] as never);

    const result = await DashboardService.getCustomerDashboard('user-1', '2026-10');

    expect(result.totalSpend).toBe(100);
    expect(result.totalDeposits).toBe(5000);
    expect(result.todaySpend).toBe(50);
    expect(result.chart.labels.length).toBeGreaterThan(0);
    expect(dashboardCache.setCachedUserDashboard).toHaveBeenCalled();
  });

  it('returns cached payload without recomputing', async () => {
    vi.mocked(dashboardCache.getCachedUserDashboard).mockResolvedValue({
      month: '2026-10',
      totalSpend: 999,
      todaySpend: 1,
      totalDeposits: 2,
      chart: { labels: [], income: [], expenses: [] },
      categoryBreakdown: [],
      recentTransactions: [],
    });

    const result = await DashboardService.getCustomerDashboard('user-1', '2026-10');
    expect(result.totalSpend).toBe(999);
    expect(TransactionRepository.findPersonalInDateRange).not.toHaveBeenCalled();
  });
});
