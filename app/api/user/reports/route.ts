import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const where: any = {
      userId: user.id,
      status: { not: 'D' },
      type: 'DEBIT',
      ...(categoryId && { categoryId }),
    };

    if (startDateStr || endDateStr) {
      where.transactionDate = {};
      if (startDateStr) where.transactionDate.gte = new Date(startDateStr);
      if (endDateStr) where.transactionDate.lte = new Date(endDateStr);
    }

    const [expenses, categoryGroup] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        include: { category: true, currency: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Fetch category names for the group by result
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryGroup.filter(g => g.categoryId !== null).map(g => g.categoryId!) } },
    });

    const categoryBreakdown = categoryGroup.map(g => {
      const cat = categories.find(c => c.id === g.categoryId);
      return {
        categoryId: g.categoryId,
        categoryName: cat?.name || 'Unknown',
        categoryColor: cat?.color || '#000000',
        totalAmount: Number(g._sum.amount || 0),
        count: g._count.id,
      };
    });

    const totalAmount = categoryBreakdown.reduce((sum, item) => sum + item.totalAmount, 0);

    return NextResponse.json({
      expenses,
      categoryBreakdown,
      totalAmount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
