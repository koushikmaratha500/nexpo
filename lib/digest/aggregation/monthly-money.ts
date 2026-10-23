import { DigestAggregationRepository } from '@/lib/api/repositories/digest-aggregation.repository';
import { UserRepository } from '@/lib/api/repositories/user.repository';
import { buildExpensePieSvg } from '../chart/pie-svg';
import { getPriorPeriod } from '../period';
import type { DigestPeriod, MonthlyDigestBuildResult, MonthlyDigestViewModel } from '../types';

function mergeCategoryRows(
  personal: Awaited<ReturnType<typeof DigestAggregationRepository.personalDebitByCategory>>,
  group: Awaited<ReturnType<typeof DigestAggregationRepository.groupShareDebitsByCategory>>,
) {
  const map = new Map<string, { categoryId: string | null; categoryName: string; amount: number }>();
  for (const row of [...personal, ...group]) {
    const key = row.categoryId ?? `name:${row.categoryName}`;
    const existing = map.get(key) ?? {
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      amount: 0,
    };
    existing.amount += row.amount;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
}

async function aggregateForPeriod(userId: string, period: DigestPeriod) {
  const { start, end } = period;
  const [totalCredit, personalDebit, personalCats, groupCats] = await Promise.all([
    DigestAggregationRepository.sumPersonalCredits(userId, start, end),
    DigestAggregationRepository.sumPersonalDebits(userId, start, end),
    DigestAggregationRepository.personalDebitByCategory(userId, start, end),
    DigestAggregationRepository.groupShareDebitsByCategory(userId, start, end),
  ]);

  const merged = mergeCategoryRows(personalCats, groupCats);
  const groupDebit = groupCats.reduce((s, c) => s + c.amount, 0);
  const totalDebit = personalDebit + groupDebit;

  return { totalCredit, totalDebit, merged };
}

export class MonthlyMoneyDigestBuilder {
  static async buildForUser(
    userId: string,
    period: DigestPeriod,
    currencySymbol = '₹',
  ): Promise<MonthlyDigestBuildResult> {
    const user = await UserRepository.findById(userId);
    if (!user?.email) {
      return { digest: null, skipReason: 'no_history' };
    }

    const hasHistory = await DigestAggregationRepository.userHasLedgerHistory(userId);
    if (!hasHistory) {
      return { digest: null, skipReason: 'no_history' };
    }

    const current = await aggregateForPeriod(userId, period);
    const priorPeriod = getPriorPeriod(period);
    const prior = await aggregateForPeriod(userId, priorPeriod);

    const variant =
      current.totalCredit === 0 && current.totalDebit === 0 ? 'quiet' : 'full';

    const expenses =
      variant === 'quiet'
        ? []
        : current.merged.map((row) => ({
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            amount: row.amount,
            percentage:
              current.totalDebit > 0
                ? Math.round((row.amount / current.totalDebit) * 1000) / 10
                : 0,
          }));

    const topCategories = expenses.slice(0, 3).map((e) => ({
      categoryName: e.categoryName,
      amount: e.amount,
    }));

    const chartSvg = buildExpensePieSvg(expenses);
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.firstName;

    const debitChangePercent = percentChange(current.totalDebit, prior.totalDebit);
    const creditChangePercent = percentChange(current.totalCredit, prior.totalCredit);

    const digest: MonthlyDigestViewModel = {
      user: { id: user.id, name, email: user.email },
      period,
      summary: {
        totalCredit: current.totalCredit,
        totalDebit: current.totalDebit,
        netCashFlow: current.totalCredit - current.totalDebit,
      },
      comparison: {
        previousMonthCredit: prior.totalCredit,
        previousMonthDebit: prior.totalDebit,
        creditChangePercent,
        debitChangePercent,
      },
      expenses,
      topCategories,
      variant,
      chartSvg,
      currencySymbol,
    };

    return { digest };
  }
}
