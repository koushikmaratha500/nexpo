import { prisma } from '@/lib/prisma';
import { Transaction, Prisma } from '@prisma/client';
import { AuditAction } from '@prisma/client';

export interface TransactionQueryParams {
  userId?: string;
  type?: 'DEBIT' | 'CREDIT';
  types?: ('DEBIT' | 'CREDIT')[];
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
    const { userId, type, types, categoryId, category, startDate, endDate, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TransactionWhereInput = {
      status: { not: 'D' },
      ...(userId && { userId }),
      ...(types?.length ? { type: { in: types } } : type ? { type } : {}),
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

  static async findRecentForUser(userId: string, take = 5) {
    return prisma.transaction.findMany({
      where: { userId, status: { not: 'D' } },
      orderBy: { transactionDate: 'desc' },
      take,
      include: {
        category: true,
        currency: true,
        paymentType: true,
        budgetDepositType: true,
      },
    });
  }

  static async findForUserReport(params: {
    userId: string;
    types: ('DEBIT' | 'CREDIT')[];
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.TransactionWhereInput = {
      userId: params.userId,
      status: { not: 'D' },
      type: { in: params.types },
      ...(params.categoryId && { categoryId: params.categoryId }),
    };

    if (params.startDate || params.endDate) {
      where.transactionDate = {};
      if (params.startDate) where.transactionDate.gte = params.startDate;
      if (params.endDate) where.transactionDate.lte = params.endDate;
    }

    return prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: { category: true, currency: true, budgetDepositType: true },
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

  /* ------------------------- Recurring transactions ------------------------- */

  static async findRecurring(userId: string) {
    return prisma.transaction.findMany({
      where: { userId, isRecurring: true, status: { not: 'D' } },
      orderBy: { transactionDate: 'asc' },
      include: { category: true, currency: true, paymentType: true, budgetDepositType: true, budgetType: true },
    });
  }

  static async findRecurringAction(transactionId: string, dueDate: Date) {
    return prisma.recurringTransactionAction.findFirst({
      where: { transactionId, dueDate },
    });
  }

  static async findRecurringActions(userId: string) {
    return prisma.recurringTransactionAction.findMany({
      where: { userId, action: 'APPROVED' },
      select: { transactionId: true, dueDate: true },
    });
  }

  static async createRecurringAction(data: Prisma.RecurringTransactionActionUncheckedCreateInput) {
    return prisma.recurringTransactionAction.create({ data });
  }

  /**
   * Converts a batch of recurring occurrences into real (one-time) transactions.
   * Runs atomically: creates each new transaction + records its approval action.
   * Already-approved occurrences are skipped idempotently.
   */
  static async approveRecurringBatch(
    userId: string,
    items: { transactionId: string; dueDate: Date }[],
    meta: { ip?: string; ua?: string } = {}
  ) {
    return prisma.$transaction(async (tx) => {
      const created: Transaction[] = [];
      const skipped: string[] = [];

      for (const item of items) {
        const source = await tx.transaction.findFirst({
          where: {
            id: item.transactionId,
            userId,
            isRecurring: true,
            status: { not: 'D' },
          },
          include: {
            category: true,
            currency: true,
            paymentType: true,
            budgetDepositType: true,
            budgetType: true,
          },
        });

        if (!source) continue;

        // Drop the time component: e.g. 2026-09-14T07:00 -> 2026-09-14T00:00
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const existing = await tx.recurringTransactionAction.findFirst({
          where: { transactionId: source.id, dueDate },
        });
        if (existing) {
          skipped.push(source.id);
          continue;
        }

        const txn = await tx.transaction.create({
          data: {
            userId,
            type: source.type,
            categoryId: source.categoryId,
            currencyId: source.currencyId,
            paymentTypeId: source.paymentTypeId,
            budgetDepositTypeId: source.budgetDepositTypeId,
            budgetTypeId: source.budgetTypeId,
            title: source.title,
            description: source.description,
            amount: source.amount,
            transactionDate: dueDate,
            notes: source.notes,
            merchant: source.merchant,
            status: 'A',
            isRecurring: false,
          },
        });

        await tx.recurringTransactionAction.create({
          data: {
            userId,
            transactionId: source.id,
            dueDate,
            action: 'APPROVED',
          },
        });

        const auditNewValue = JSON.parse(JSON.stringify(txn));
        await tx.transactionAudit.create({
          data: {
            transactionId: txn.id,
            action: AuditAction.CREATE,
            newValue: { ...auditNewValue, sourceRecurringId: source.id },
            ipAddress: meta.ip || null,
            userAgent: meta.ua || null,
          },
        });

        created.push(txn);
      }

      return { created, skipped };
    });
  }

  /* ----------------------------- Bulk import ----------------------------- */

  /**
   * Bulk-creates transactions from validated import rows inside a single
   * transaction, writing an audit trail for each created record.
   */
  static async bulkCreateTransactions(
    userId: string,
    rows: { data: Prisma.TransactionUncheckedCreateInput; meta?: { ip?: string; ua?: string } }[]
  ) {
    return prisma.$transaction(async (tx) => {
      const created: Transaction[] = [];
      for (const row of rows) {
        const txn = await tx.transaction.create({
          data: {
            ...row.data,
            userId,
            status: 'A',
          },
        });
        await tx.transactionAudit.create({
          data: {
            transactionId: txn.id,
            action: AuditAction.CREATE,
            newValue: JSON.parse(JSON.stringify(txn)),
            ipAddress: row.meta?.ip || null,
            userAgent: row.meta?.ua || null,
          },
        });
        created.push(txn);
      }
      return created;
    });
  }

  static async findDistinctMonths(userId: string): Promise<string[]> {
    const rows = await prisma.transaction.findMany({
      where: { userId, status: { not: 'D' } },
      select: { transactionDate: true },
    });
    const months = new Set<string>();
    for (const row of rows) {
      const d = row.transactionDate;
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return [...months].sort();
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
