import { prisma } from '@/lib/prisma';
import { Transaction, Prisma } from '@prisma/client';

export interface TransactionQueryParams {
  userId?: string;
  type?: 'DEBIT' | 'CREDIT';
  categoryId?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export class TransactionRepository {
  static async findById(id: string, userId?: string): Promise<Transaction | null> {
    return prisma.transaction.findFirst({
      where: {
        id,
        status: { not: 'D' },
        ...(userId && { userId }),
      },
      include: { category: true, currency: true, paymentType: true, budgetDepositType: true, budgetType: true },
    });
  }

  static async findAll(params: TransactionQueryParams) {
    const { userId, type, categoryId, category, startDate, endDate, page = 1, pageSize = 5 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TransactionWhereInput = {
      status: { not: 'D' },
      ...(userId && { userId }),
      ...(type && { type }),
      ...(categoryId && { categoryId }),
    };

    if (category) {
      where.budgetDepositType = {
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
        include: { category: true, currency: true, paymentType: true, budgetDepositType: true, budgetType: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { items, total };
  }

  static async aggregateByType(type: 'DEBIT' | 'CREDIT', where: Prisma.TransactionWhereInput = {}) {
    return prisma.transaction.aggregate({
      where: { status: { not: 'D' }, type, ...where },
      _sum: { amount: true },
    });
  }

  static async countByType(type: 'DEBIT' | 'CREDIT', where: Prisma.TransactionWhereInput = {}) {
    return prisma.transaction.count({
      where: { status: { not: 'D' }, type, ...where },
    });
  }

  static async findRecentByType(type: 'DEBIT' | 'CREDIT', take = 5, where: Prisma.TransactionWhereInput = {}) {
    return prisma.transaction.findMany({
      where: { status: { not: 'D' }, type, ...where },
      orderBy: { transactionDate: 'desc' },
      take,
      include: { user: true, category: true, currency: true },
    });
  }

  static async create(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction> {
    return prisma.transaction.create({
      data: {
        ...data,
        status: 'A',
      },
      include: { category: true, currency: true, paymentType: true, budgetDepositType: true, budgetType: true },
    });
  }

  static async update(id: string, data: Prisma.TransactionUncheckedUpdateInput): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data,
      include: { category: true, currency: true, paymentType: true, budgetDepositType: true, budgetType: true },
    });
  }

  static async softDelete(id: string): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data: { status: 'D' },
    });
  }

  static async createAudit(data: Prisma.TransactionAuditUncheckedCreateInput) {
    return prisma.transactionAudit.create({ data });
  }

  static serializeAmount(t: Record<string, unknown>) {
    const amount = t.amount;
    return typeof amount === 'object' && amount !== null ? Number(amount) : amount;
  }

  static serializeItems(items: Record<string, unknown>[]) {
    return items.map((t) => ({
      ...t,
      amount: this.serializeAmount(t),
    }));
  }
}
