import { prisma } from '@/lib/prisma';

export class DepositRepository {
  static async findById(id: string, userId?: string) {
    return prisma.transaction.findFirst({
      where: {
        id,
        type: 'CREDIT',
        status: { not: 'D' },
        ...(userId && { userId }),
      },
      include: {
        currency: true,
        budgetDepositType: true,
        paymentType: true,
        budgetType: true,
      },
    });
  }

  static async findAll(params: {
    userId?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { userId, category, startDate, endDate, page = 1, pageSize = 5 } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      type: 'CREDIT',
      status: { not: 'D' },
      ...(userId && { userId }),
    };

    if (category) {
      where.budgetDepositTypeId = {
        name: { equals: category, mode: 'insensitive' }
      };
    }

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
        include: {
          currency: true,
          budgetDepositType: true,
          paymentType: true,
          budgetType: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { items, total };
  }

  static async create(data: any) {
    return prisma.transaction.create({
      data: {
        ...data,
        type: 'CREDIT',
        status: 'A',
      },
      include: {
        currency: true,
        budgetDepositType: true,
        paymentType: true,
        budgetType: true,
      },
    });
  }

  static async update(id: string, data: any) {
    return prisma.transaction.update({
      where: { id },
      data,
      include: {
        currency: true,
        budgetDepositType: true,
        paymentType: true,
        budgetType: true,
      },
    });
  }

  static async softDelete(id: string) {
    return prisma.transaction.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
