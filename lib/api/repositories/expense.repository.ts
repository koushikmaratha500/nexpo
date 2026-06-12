import { prisma } from '@/lib/prisma';

export class ExpenseRepository {
  static async findById(id: string, userId?: string) {
    return prisma.expense.findFirst({
      where: {
        id,
        status: { not: 'D' },
        ...(userId && { userId }),
      },
      include: { category: true, currency: true, paymentType: true },
    });
  }

  static async findAll(params: {
    userId?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { userId, categoryId, startDate, endDate, page = 1, pageSize = 5 } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: { not: 'D' },
      ...(userId && { userId }),
      ...(categoryId && { categoryId }),
    };

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = startDate;
      }
      if (endDate) {
        where.expenseDate.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { expenseDate: 'desc' },
        include: { category: true, currency: true, paymentType: true },
      }),
      prisma.expense.count({ where }),
    ]);

    return { items, total };
  }

  static async create(data: any) {
    return prisma.expense.create({
      data: {
        ...data,
        status: 'A',
      },
      include: { category: true, currency: true, paymentType: true },
    });
  }

  static async update(id: string, data: any) {
    return prisma.expense.update({
      where: { id },
      data,
      include: { category: true, currency: true, paymentType: true },
    });
  }

  static async softDelete(id: string) {
    return prisma.expense.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
