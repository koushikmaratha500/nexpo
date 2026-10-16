import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DigestAggregationRepository } from '@/lib/api/repositories/digest-aggregation.repository';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { MonthlyMoneyDigestBuilder } from '@/lib/digest/aggregation/monthly-money';
import { resolveDigestPeriod } from '@/lib/digest/period';

vi.mock('@/lib/api/repositories/digest-aggregation.repository', () => ({
  DigestAggregationRepository: {
    userHasLedgerHistory: vi.fn(),
    sumPersonalCredits: vi.fn(),
    sumPersonalDebits: vi.fn(),
    personalDebitByCategory: vi.fn(),
    groupShareDebitsByCategory: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: {
    findById: vi.fn(),
  },
}));

describe('MonthlyMoneyDigestBuilder', () => {
  const period = resolveDigestPeriod('2026-09');

  beforeEach(() => {
    vi.mocked(UserRepository.findById).mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      firstName: 'Asha',
      lastName: null,
    } as never);
    vi.mocked(DigestAggregationRepository.userHasLedgerHistory).mockResolvedValue(true);
    vi.mocked(DigestAggregationRepository.sumPersonalCredits).mockResolvedValue(1000);
    vi.mocked(DigestAggregationRepository.sumPersonalDebits).mockResolvedValue(400);
    vi.mocked(DigestAggregationRepository.personalDebitByCategory).mockResolvedValue([
      { categoryId: 'c1', categoryName: 'Food', amount: 300 },
    ]);
    vi.mocked(DigestAggregationRepository.groupShareDebitsByCategory).mockResolvedValue([
      { categoryId: 'c2', categoryName: 'Rent', amount: 100 },
    ]);
  });

  it('merges personal and group debits for totals and top categories', async () => {
    const result = await MonthlyMoneyDigestBuilder.buildForUser('u1', period);
    expect(result.digest?.summary.totalDebit).toBe(500);
    expect(result.digest?.summary.totalCredit).toBe(1000);
    expect(result.digest?.topCategories[0]?.categoryName).toBe('Food');
    expect(result.digest?.expenses).toHaveLength(2);
  });

  it('skips users with no ledger history', async () => {
    vi.mocked(DigestAggregationRepository.userHasLedgerHistory).mockResolvedValue(false);
    const result = await MonthlyMoneyDigestBuilder.buildForUser('u1', period);
    expect(result.digest).toBeNull();
    expect(result.skipReason).toBe('no_history');
  });
});
