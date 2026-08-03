import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    const [debitSum, creditSum, recentTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'DEBIT', status: { not: 'D' } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'CREDIT', status: { not: 'D' } },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id, status: { not: 'D' } },
        orderBy: { transactionDate: 'desc' },
        take: 5,
        include: { category: true, currency: true, paymentType: true, budgetDepositType: true },
      }),
    ]);

    return NextResponse.json({
      totalExpenses: Number(debitSum._sum.amount || 0),
      totalBudgets: Number(creditSum._sum.amount || 0),
      recentExpenses: recentTransactions.filter((t) => t.type === 'DEBIT'),
      recentBudgets: recentTransactions.filter((t) => t.type === 'CREDIT'),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
