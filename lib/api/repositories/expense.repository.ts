import { prisma } from '@/lib/prisma';

export class ExpenseRepository {
  static async findById(id: string, userId?: string) {
    return prisma.transaction.findFirst({
      where: {
        id,
        type: 'DEBIT',
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
      type: 'DEBIT',
      status: { not: 'D' },
      ...(userId && { userId }),
      ...(categoryId && { categoryId }),
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = startDate;
      }
      if (endDate) {
        where.transactionDate.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { transactionDate: 'desc' },
        include: { category: true, currency: true, paymentType: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { items, total };
  }

  static async create(data: any) {
    return prisma.transaction.create({
      data: {
        ...data,
        type: 'DEBIT',
        status: 'A',
      },
      include: { category: true, currency: true, paymentType: true },
    });
  }

  static async update(id: string, data: any) {
    return prisma.transaction.update({
      where: { id },
      data,
      include: { category: true, currency: true, paymentType: true },
    });
  }

  static async softDelete(id: string) {
    return prisma.transaction.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
