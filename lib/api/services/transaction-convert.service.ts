import { AuditAction, GroupMemberRole, SplitMode, type Transaction } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { GroupRepository } from '../repositories/group.repository';
import { GroupService } from './group.service';
import { SplitService } from './split.service';
import type { ConvertTransactionDto } from '../dtos/transaction-convert.dto';

interface RequestMeta {
  ip?: string;
  ua?: string;
}

type TransactionWithRelations = NonNullable<Awaited<ReturnType<typeof loadSourceTransaction>>>;

async function loadSourceTransaction(transactionId: string) {
  return prisma.transaction.findFirst({
    where: { id: transactionId, status: { not: 'D' } },
    include: {
      category: true,
      currency: true,
      paymentType: true,
      budgetDepositType: true,
      budgetType: true,
      splits: true,
    },
  });
}

function assertNotRecurring(source: Transaction) {
  if (source.isRecurring) {
    throw new HttpError(400, 'Recurring transactions cannot be converted');
  }
}

function copyTransactionFields(source: TransactionWithRelations) {
  return {
    userId: source.userId,
    type: source.type,
    categoryId: source.categoryId,
    currencyId: source.currencyId,
    paymentTypeId: source.paymentTypeId,
    budgetDepositTypeId: source.budgetDepositTypeId,
    budgetTypeId: source.budgetTypeId,
    title: source.title,
    description: source.description,
    amount: source.amount,
    transactionDate: source.transactionDate,
    notes: source.notes,
    documentUrl: source.documentUrl,
    documentFileName: source.documentFileName,
    documentMimeType: source.documentMimeType,
    documentSize: source.documentSize,
    merchant: source.merchant,
    isRecurring: false,
    recurringDay: null as number | null,
  };
}

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function hardDeleteTransaction(tx: PrismaTx, transactionId: string) {
  await tx.recurringTransactionAction.deleteMany({ where: { transactionId } });
  await tx.transactionShare.updateMany({
    where: { transactionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await tx.transaction.delete({ where: { id: transactionId } });
}

export class TransactionConvertService {
  static async convert(userId: string, transactionId: string, dto: ConvertTransactionDto, meta: RequestMeta = {}) {
    const source = await loadSourceTransaction(transactionId);
    if (!source) {
      throw new HttpError(404, 'Transaction not found');
    }
    assertNotRecurring(source);

    if (dto.target === 'group') {
      return this.convertPersonalToGroup(source, userId, dto.groupId!, meta);
    }
    return this.convertGroupToPersonal(source, userId, meta);
  }

  private static async convertPersonalToGroup(
    source: TransactionWithRelations,
    userId: string,
    groupId: string,
    meta: RequestMeta,
  ) {
    if (source.groupId) {
      throw new HttpError(400, 'Transaction is already in a group ledger');
    }
    if (source.userId !== userId) {
      throw new HttpError(403, 'You can only convert your own personal transactions');
    }

    await GroupService.assertMember(groupId, userId);
    const group = await GroupRepository.findByIdWithMembers(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const participants = group.members.map((member) => ({
      userId: member.userId,
      included: true,
    }));
    const computedSplits = SplitService.calculate(
      'EQUAL_INCLUDED',
      Number(source.amount),
      participants,
      userId,
    );

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          ...copyTransactionFields(source),
          userId,
          groupId,
          createdByUserId: userId,
          splitMode: SplitMode.EQUAL_INCLUDED,
        },
      });

      await tx.groupExpenseSplit.createMany({
        data: computedSplits.map((split) => ({
          transactionId: created.id,
          userId: split.userId,
          included: split.included,
          shareAmount: split.shareAmount ?? null,
          sharePercent: split.sharePercent ?? null,
          computedAmount: split.computedAmount,
        })),
      });

      await hardDeleteTransaction(tx, source.id);

      await tx.transactionAudit.create({
        data: {
          transactionId: created.id,
          action: AuditAction.CREATE,
          newValue: {
            convertedFromTransactionId: source.id,
            target: 'group',
            groupId,
          },
          ipAddress: meta.ip || null,
          userAgent: meta.ua || null,
        },
      });

      return created;
    });

    return {
      newTransactionId: result.id,
      deletedTransactionId: source.id,
      target: 'group' as const,
      groupId,
    };
  }

  private static async convertGroupToPersonal(
    source: TransactionWithRelations,
    userId: string,
    meta: RequestMeta,
  ) {
    if (!source.groupId) {
      throw new HttpError(400, 'Transaction is already in your personal ledger');
    }

    const membership = await GroupService.assertMember(source.groupId, userId);
    const isCreator = source.createdByUserId === userId;
    const isAdmin = membership.role === GroupMemberRole.ADMIN;
    if (!isCreator && !isAdmin) {
      throw new HttpError(403, 'Only the creator or a group admin can convert this transaction');
    }

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          ...copyTransactionFields(source),
          userId: source.userId,
          groupId: null,
          createdByUserId: null,
          splitMode: null,
        },
      });

      await hardDeleteTransaction(tx, source.id);

      await tx.transactionAudit.create({
        data: {
          transactionId: created.id,
          action: AuditAction.CREATE,
          newValue: {
            convertedFromTransactionId: source.id,
            target: 'personal',
            previousGroupId: source.groupId,
          },
          ipAddress: meta.ip || null,
          userAgent: meta.ua || null,
        },
      });

      return created;
    });

    return {
      newTransactionId: result.id,
      deletedTransactionId: source.id,
      target: 'personal' as const,
    };
  }
}
