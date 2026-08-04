import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const typeParam = searchParams.get('type') || 'DEBIT';
    const types: ('DEBIT' | 'CREDIT')[] =
      typeParam === 'ALL' ? ['DEBIT', 'CREDIT'] : typeParam === 'CREDIT' ? ['CREDIT'] : ['DEBIT'];

    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
      status: { not: 'D' },
      type: { in: types },
      ...(categoryId && { categoryId }),
    };

    if (startDateStr || endDateStr) {
      where.transactionDate = {};
      if (startDateStr) where.transactionDate.gte = new Date(startDateStr);
      if (endDateStr) where.transactionDate.lte = new Date(endDateStr);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: { category: true, currency: true, budgetDepositType: true },
    });

    const breakdownMap = new Map<string, { totalAmount: number; count: number }>();
    let totalAmount = 0;
    for (const txn of transactions) {
      const label = txn.category?.name || txn.budgetDepositType?.name || 'Other';
      const amount = Number(txn.amount);
      totalAmount += amount;
      const entry = breakdownMap.get(label) || { totalAmount: 0, count: 0 };
      entry.totalAmount += amount;
      entry.count += 1;
      breakdownMap.set(label, entry);
    }

    const categoryBreakdown = Array.from(breakdownMap.entries())
      .map(([categoryName, { totalAmount: amount, count }]) => ({
        categoryId: null,
        categoryName,
        totalAmount: amount,
        count,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return NextResponse.json({
      expenses: transactions,
      categoryBreakdown,
      totalAmount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
