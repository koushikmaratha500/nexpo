import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

export type CategoryAmountRow = {
  categoryId: string | null;
  categoryName: string;
  amount: number;
};

export class DigestAggregationRepository {
  static async userHasLedgerHistory(userId: string): Promise<boolean> {
    const [personal, split] = await Promise.all([
      prisma.transaction.findFirst({
        where: { userId, groupId: null, status: { not: 'D' } },
        select: { id: true },
      }),
      prisma.groupExpenseSplit.findFirst({
        where: { userId, included: true },
        select: { id: true },
      }),
    ]);
    return Boolean(personal || split);
  }

  static async sumPersonalCredits(userId: string, start: Date, end: Date): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        groupId: null,
        status: { not: 'D' },
        type: TransactionType.CREDIT,
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  static async sumPersonalDebits(userId: string, start: Date, end: Date): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        groupId: null,
        status: { not: 'D' },
        type: TransactionType.DEBIT,
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  static async personalDebitByCategory(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<CategoryAmountRow[]> {
    const rows = await prisma.transaction.findMany({
      where: {
        userId,
        groupId: null,
        status: { not: 'D' },
        type: TransactionType.DEBIT,
        transactionDate: { gte: start, lt: end },
      },
      select: {
        amount: true,
        categoryId: true,
        category: { select: { name: true } },
        budgetDepositType: { select: { name: true } },
      },
    });

    const map = new Map<string, CategoryAmountRow>();
    for (const row of rows) {
      const categoryName = row.category?.name || row.budgetDepositType?.name || 'Other';
      const key = row.categoryId ?? `name:${categoryName}`;
      const existing = map.get(key) ?? {
        categoryId: row.categoryId,
        categoryName,
        amount: 0,
      };
      existing.amount += Number(row.amount);
      map.set(key, existing);
    }
    return Array.from(map.values());
  }

  static async groupShareDebitsByCategory(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<CategoryAmountRow[]> {
    const splits = await prisma.groupExpenseSplit.findMany({
      where: {
        userId,
        included: true,
        transaction: {
          groupId: { not: null },
          status: { not: 'D' },
          type: TransactionType.DEBIT,
          transactionDate: { gte: start, lt: end },
        },
      },
      select: {
        computedAmount: true,
        transaction: {
          select: {
            categoryId: true,
            category: { select: { name: true } },
            budgetDepositType: { select: { name: true } },
          },
        },
      },
    });

    const map = new Map<string, CategoryAmountRow>();
    for (const split of splits) {
      const categoryName =
        split.transaction.category?.name || split.transaction.budgetDepositType?.name || 'Other';
      const categoryId = split.transaction.categoryId;
      const key = categoryId ?? `name:${categoryName}`;
      const existing = map.get(key) ?? { categoryId, categoryName, amount: 0 };
      existing.amount += Number(split.computedAmount);
      map.set(key, existing);
    }
    return Array.from(map.values());
  }
}
