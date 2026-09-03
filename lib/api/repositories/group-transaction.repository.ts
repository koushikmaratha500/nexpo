import { prisma } from '@/lib/prisma';
import { AuditAction, Prisma, SplitMode } from '@prisma/client';

export interface GroupTransactionQueryParams {
  groupId: string;
  type?: 'DEBIT' | 'CREDIT';
  page?: number;
  pageSize?: number;
}

type SplitRowInput = {
  userId: string;
  included: boolean;
  shareAmount?: number | null;
  sharePercent?: number | null;
  computedAmount: number;
};

const transactionInclude = {
  category: true,
  currency: true,
  paymentType: true,
  budgetDepositType: true,
  budgetType: true,
  createdBy: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  },
  splits: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
} satisfies Prisma.TransactionInclude;

export class GroupTransactionRepository {
  static async createWithSplits(params: {
    transaction: Prisma.TransactionUncheckedCreateInput & {
      groupId: string;
      createdByUserId: string;
      splitMode: SplitMode;
    };
    splits: SplitRowInput[];
    audit?: { ip?: string; ua?: string };
  }) {
    return prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          ...params.transaction,
          status: 'A',
        },
        include: transactionInclude,
      });

      await tx.groupExpenseSplit.createMany({
        data: params.splits.map((split) => ({
          transactionId: txn.id,
          userId: split.userId,
          included: split.included,
          shareAmount: split.shareAmount ?? null,
          sharePercent: split.sharePercent ?? null,
          computedAmount: split.computedAmount,
        })),
      });

      const withSplits = await tx.transaction.findUniqueOrThrow({
        where: { id: txn.id },
        include: transactionInclude,
      });

      await tx.transactionAudit.create({
        data: {
          transactionId: txn.id,
          action: AuditAction.CREATE,
          newValue: JSON.parse(JSON.stringify(withSplits)),
          ipAddress: params.audit?.ip || null,
          userAgent: params.audit?.ua || null,
        },
      });

      return withSplits;
    });
  }

  static async findByGroup(params: GroupTransactionQueryParams) {
    const { groupId, type, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TransactionWhereInput = {
      groupId,
      status: { not: 'D' },
      ...(type ? { type } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { transactionDate: 'desc' },
        include: transactionInclude,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { items, total };
  }

  static async findByIdInGroup(groupId: string, transactionId: string) {
    return prisma.transaction.findFirst({
      where: {
        id: transactionId,
        groupId,
        status: { not: 'D' },
      },
      include: transactionInclude,
    });
  }

  static async updateWithSplits(params: {
    transactionId: string;
    transaction: Prisma.TransactionUncheckedUpdateInput;
    splitMode?: SplitMode;
    splits?: SplitRowInput[];
    audit?: { ip?: string; ua?: string; oldValue: unknown };
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: params.transactionId },
        data: {
          ...params.transaction,
          ...(params.splitMode ? { splitMode: params.splitMode } : {}),
        },
        include: transactionInclude,
      });

      if (params.splits) {
        await tx.groupExpenseSplit.deleteMany({ where: { transactionId: params.transactionId } });
        await tx.groupExpenseSplit.createMany({
          data: params.splits.map((split) => ({
            transactionId: params.transactionId,
            userId: split.userId,
            included: split.included,
            shareAmount: split.shareAmount ?? null,
            sharePercent: split.sharePercent ?? null,
            computedAmount: split.computedAmount,
          })),
        });
      }

      const withSplits = await tx.transaction.findUniqueOrThrow({
        where: { id: params.transactionId },
        include: transactionInclude,
      });

      await tx.transactionAudit.create({
        data: {
          transactionId: params.transactionId,
          action: AuditAction.UPDATE,
          oldValue: JSON.parse(JSON.stringify(params.audit?.oldValue ?? updated)),
          newValue: JSON.parse(JSON.stringify(withSplits)),
          ipAddress: params.audit?.ip || null,
          userAgent: params.audit?.ua || null,
        },
      });

      return withSplits;
    });
  }

  static async softDeleteInGroup(params: {
    transactionId: string;
    audit?: { ip?: string; ua?: string; oldValue: unknown };
  }) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.transaction.update({
        where: { id: params.transactionId },
        data: { status: 'D' },
      });

      await tx.transactionAudit.create({
        data: {
          transactionId: params.transactionId,
          action: AuditAction.DELETE,
          oldValue: JSON.parse(JSON.stringify(params.audit?.oldValue ?? deleted)),
          ipAddress: params.audit?.ip || null,
          userAgent: params.audit?.ua || null,
        },
      });

      return deleted;
    });
  }

  static async computeBalances(groupId: string) {
    const [members, transactions] = await Promise.all([
      prisma.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.transaction.findMany({
        where: { groupId, status: { not: 'D' } },
        select: {
          userId: true,
          amount: true,
          currency: { select: { code: true, symbol: true } },
          splits: {
            select: {
              userId: true,
              computedAmount: true,
            },
          },
        },
      }),
    ]);

    const paidByUser = new Map<string, number>();
    const owedByUser = new Map<string, number>();

    for (const member of members) {
      paidByUser.set(member.userId, 0);
      owedByUser.set(member.userId, 0);
    }

    for (const txn of transactions) {
      const amount = Number(txn.amount);
      paidByUser.set(txn.userId, (paidByUser.get(txn.userId) ?? 0) + amount);

      for (const split of txn.splits) {
        owedByUser.set(split.userId, (owedByUser.get(split.userId) ?? 0) + Number(split.computedAmount));
      }
    }

    const currencyRecord = transactions.find((txn) => txn.currency?.code)?.currency;
    const currencyCode = currencyRecord?.code ?? 'INR';
    const currencySymbol = currencyRecord?.symbol ?? '₹';

    return {
      currencyCode,
      currencySymbol,
      members: members.map((member) => {
        const netPaid = Math.round((paidByUser.get(member.userId) ?? 0) * 100) / 100;
        const netOwed = Math.round((owedByUser.get(member.userId) ?? 0) * 100) / 100;
        const balance = Math.round((netPaid - netOwed) * 100) / 100;
        return {
          userId: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          netPaid,
          netOwed,
          balance,
        };
      }),
    };
  }

  static serializeTransaction(txn: Record<string, unknown>) {
    const amount = txn.amount;
    const serializedAmount =
      typeof amount === 'object' && amount !== null ? Number(amount) : amount;

    const splits = Array.isArray(txn.splits)
      ? txn.splits.map((split: Record<string, unknown>) => ({
          ...split,
          shareAmount:
            split.shareAmount != null && typeof split.shareAmount === 'object'
              ? Number(split.shareAmount)
              : split.shareAmount,
          sharePercent:
            split.sharePercent != null && typeof split.sharePercent === 'object'
              ? Number(split.sharePercent)
              : split.sharePercent,
          computedAmount:
            split.computedAmount != null && typeof split.computedAmount === 'object'
              ? Number(split.computedAmount)
              : split.computedAmount,
        }))
      : [];

    return {
      ...txn,
      amount: serializedAmount,
      splits,
    };
  }

  static serializeItems(items: Record<string, unknown>[]) {
    return items.map((item) => this.serializeTransaction(item));
  }
}
