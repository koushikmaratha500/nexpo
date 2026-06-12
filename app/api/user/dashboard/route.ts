import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    const [expenseSum, budgetSum, recentExpenses, recentBudgets] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId: user.id, status: { not: 'D' } },
        _sum: { amount: true },
      }),
      prisma.budget.aggregate({
        where: { userId: user.id, status: { not: 'D' } },
        _sum: { amount: true },
      }),
      prisma.expense.findMany({
        where: { userId: user.id, status: { not: 'D' } },
        orderBy: { expenseDate: 'desc' },
        take: 5,
        include: { category: true, currency: true },
      }),
      prisma.budget.findMany({
        where: { userId: user.id, status: { not: 'D' } },
        orderBy: { date: 'desc' },
        take: 5,
        include: { currency: true, budgetDepositType: true },
      }),
    ]);

    return NextResponse.json({
      totalExpenses: Number(expenseSum._sum.amount || 0),
      totalBudgets: Number(budgetSum._sum.amount || 0),
      recentExpenses,
      recentBudgets,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
