import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '@/lib/api/services/dashboard.service';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';

vi.mock('@/lib/api/repositories/transaction.repository', () => ({
  TransactionRepository: {
    findPersonalInDateRange: vi.fn(),
  },
}));

describe('DashboardService.getCustomerDashboard', () => {
  beforeEach(() => {
    vi.mocked(TransactionRepository.findPersonalInDateRange).mockReset();
  });

  it('aggregates month metrics from a single repository query', async () => {
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
      {
        id: '2',
        type: 'CREDIT',
        title: 'Salary',
        amount: 5000,
        transactionDate: new Date(2026, 9, 1),
        category: { name: 'Salary', code: 'SALARY', type: 'CREDIT' },
        currency: { code: 'INR' },
        paymentType: { name: 'Account' },
      },
    ] as never);

    const result = await DashboardService.getCustomerDashboard('user-1', '2026-10');

    expect(TransactionRepository.findPersonalInDateRange).toHaveBeenCalledTimes(1);
    expect(result.month).toBe('2026-10');
    expect(result.totalSpend).toBe(100);
    expect(result.totalDeposits).toBe(5000);
    expect(result.recentTransactions).toHaveLength(2);
    expect(result.chart.labels.length).toBeGreaterThan(0);
  });
});
