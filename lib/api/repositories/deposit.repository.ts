import { prisma } from '@/lib/prisma';

export class DepositRepository {
  static async findById(id: string, userId?: string) {
    return prisma.budget.findFirst({
      where: {
        id,
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
      status: { not: 'D' },
      ...(userId && { userId }),
    };

    if (category) {
      where.budgetDepositType = {
        name: { equals: category, mode: 'insensitive' }
      };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: {
          currency: true,
          budgetDepositType: true,
          paymentType: true,
          budgetType: true,
        },
      }),
      prisma.budget.count({ where }),
    ]);

    return { items, total };
  }

  static async create(data: any) {
    return prisma.budget.create({
      data: {
        ...data,
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
    return prisma.budget.update({
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
    return prisma.budget.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
