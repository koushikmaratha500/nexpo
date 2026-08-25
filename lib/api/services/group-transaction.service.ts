import { GroupMemberRole } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler';
import { GroupRepository } from '../repositories/group.repository';
import { GroupTransactionRepository } from '../repositories/group-transaction.repository';
import { MetaResolutionService } from './meta-resolution.service';
import { GroupService } from './group.service';
import { SplitService } from './split.service';
import { SettlementService } from './settlement.service';
import type { CreateGroupTransactionDto, UpdateGroupTransactionDto } from '../dtos/group-transaction.dto';

interface RequestMeta {
  ip?: string;
  ua?: string;
}

export class GroupTransactionService {
  static async listTransactions(
    groupId: string,
    userId: string,
    params: { type?: 'DEBIT' | 'CREDIT'; page?: number; pageSize?: number },
  ) {
    await GroupService.assertMember(groupId, userId);

    const result = await GroupTransactionRepository.findByGroup({
      groupId,
      type: params.type,
      page: params.page,
      pageSize: params.pageSize,
    });

    return {
      items: GroupTransactionRepository.serializeItems(result.items as Record<string, unknown>[]),
      total: result.total,
    };
  }

  static async createTransaction(
    groupId: string,
    userId: string,
    data: CreateGroupTransactionDto,
    meta: RequestMeta = {},
  ) {
    await GroupService.assertMember(groupId, userId);

    const group = await GroupRepository.findByIdWithMembers(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const memberIds = new Set(group.members.map((member) => member.userId));
    for (const participant of data.split.participants) {
      if (!memberIds.has(participant.userId)) {
        throw new HttpError(400, 'Split participants must be members of this group');
      }
    }

    const resolved = await MetaResolutionService.resolveForTransaction(data);
    const payerUserId = userId;

    let computedSplits;
    try {
      computedSplits = SplitService.calculate(
        data.split.mode,
        data.amount,
        data.split.participants,
        payerUserId,
      );
    } catch (error) {
      throw new HttpError(400, error instanceof Error ? error.message : 'Invalid split configuration');
    }

    const transaction = await GroupTransactionRepository.createWithSplits({
      transaction: {
        userId: payerUserId,
        groupId,
        createdByUserId: userId,
        splitMode: data.split.mode,
        type: data.type,
        categoryId: resolved.categoryId,
        currencyId: resolved.currencyId,
        paymentTypeId: resolved.paymentTypeId,
        budgetDepositTypeId: resolved.budgetDepositTypeId,
        budgetTypeId: resolved.budgetTypeId,
        title: data.title || data.merchant || 'Group expense',
        description: data.description || data.merchant || null,
        amount: data.amount,
        transactionDate: data.transactionDate,
        notes: data.notes || null,
        documentUrl: data.documentUrl || null,
        documentFileName: data.documentFileName || null,
        documentMimeType: data.documentMimeType || null,
        documentSize: data.documentSize || null,
        merchant: data.merchant || null,
        isRecurring: false,
      },
      splits: computedSplits.map((split) => ({
        userId: split.userId,
        included: split.included,
        shareAmount: split.shareAmount ?? null,
        sharePercent: split.sharePercent ?? null,
        computedAmount: split.computedAmount,
      })),
      audit: meta,
    });

    return GroupTransactionRepository.serializeTransaction(transaction as Record<string, unknown>);
  }

  static async updateTransaction(
    groupId: string,
    transactionId: string,
    userId: string,
    data: UpdateGroupTransactionDto,
    meta: RequestMeta = {},
  ) {
    const membership = await GroupService.assertMember(groupId, userId);
    const existing = await GroupTransactionRepository.findByIdInGroup(groupId, transactionId);
    if (!existing) {
      throw new HttpError(404, 'Group transaction not found');
    }

    this.assertCanModify(existing.createdByUserId, membership.role, userId);

    const resolved = await MetaResolutionService.resolveForTransaction(data);
    const updateData: Record<string, unknown> = {
      ...(data.title !== undefined || data.merchant !== undefined
        ? { title: data.title || data.merchant }
        : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.transactionDate !== undefined ? { transactionDate: data.transactionDate } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.merchant !== undefined ? { merchant: data.merchant } : {}),
      ...(resolved.categoryId ? { categoryId: resolved.categoryId } : {}),
      ...(resolved.currencyId ? { currencyId: resolved.currencyId } : {}),
      ...(resolved.paymentTypeId ? { paymentTypeId: resolved.paymentTypeId } : {}),
      ...(resolved.budgetDepositTypeId ? { budgetDepositTypeId: resolved.budgetDepositTypeId } : {}),
      ...(resolved.budgetTypeId ? { budgetTypeId: resolved.budgetTypeId } : {}),
      ...(data.documentUrl !== undefined ? { documentUrl: data.documentUrl } : {}),
      ...(data.documentFileName !== undefined ? { documentFileName: data.documentFileName } : {}),
      ...(data.documentMimeType !== undefined ? { documentMimeType: data.documentMimeType } : {}),
      ...(data.documentSize !== undefined ? { documentSize: data.documentSize } : {}),
    };

    let splits;
    let splitMode = existing.splitMode ?? undefined;

    if (data.split) {
      const group = await GroupRepository.findByIdWithMembers(groupId);
      if (!group) {
        throw new HttpError(404, 'Group not found');
      }

      const memberIds = new Set(group.members.map((member) => member.userId));
      for (const participant of data.split.participants) {
        if (!memberIds.has(participant.userId)) {
          throw new HttpError(400, 'Split participants must be members of this group');
        }
      }

      const amount = data.amount ?? Number(existing.amount);
      try {
        splits = SplitService.calculate(data.split.mode, amount, data.split.participants, existing.userId);
        splitMode = data.split.mode;
      } catch (error) {
        throw new HttpError(400, error instanceof Error ? error.message : 'Invalid split configuration');
      }
    }

    const updated = await GroupTransactionRepository.updateWithSplits({
      transactionId,
      transaction: updateData,
      splitMode,
      splits: splits?.map((split) => ({
        userId: split.userId,
        included: split.included,
        shareAmount: split.shareAmount ?? null,
        sharePercent: split.sharePercent ?? null,
        computedAmount: split.computedAmount,
      })),
      audit: { ...meta, oldValue: existing },
    });

    return GroupTransactionRepository.serializeTransaction(updated as Record<string, unknown>);
  }

  static async deleteTransaction(groupId: string, transactionId: string, userId: string, meta: RequestMeta = {}) {
    const membership = await GroupService.assertMember(groupId, userId);
    const existing = await GroupTransactionRepository.findByIdInGroup(groupId, transactionId);
    if (!existing) {
      throw new HttpError(404, 'Group transaction not found');
    }

    this.assertCanModify(existing.createdByUserId, membership.role, userId);

    await GroupTransactionRepository.softDeleteInGroup({
      transactionId,
      audit: { ...meta, oldValue: existing },
    });

    return { success: true };
  }

  static async getBalances(groupId: string, userId: string) {
    await GroupService.assertMember(groupId, userId);
    return GroupTransactionRepository.computeBalances(groupId);
  }

  static async exportSettlementCsv(groupId: string, userId: string) {
    await GroupService.assertMember(groupId, userId);
    const balances = await GroupTransactionRepository.computeBalances(groupId);
    const transfers = SettlementService.computeTransfers(balances.members);
    const csv = SettlementService.buildSettlementCsv({
      currency: balances.currencyCode,
      members: balances.members,
      transfers,
    });

    return {
      csv,
      filename: `group-${groupId.slice(0, 8)}-settlements.csv`,
    };
  }

  private static assertCanModify(
    createdByUserId: string | null | undefined,
    role: GroupMemberRole,
    actorUserId: string,
  ) {
    const isCreator = createdByUserId === actorUserId;
    const isAdmin = role === GroupMemberRole.ADMIN;
    if (!isCreator && !isAdmin) {
      throw new HttpError(403, 'Only the creator or a group admin can modify this transaction');
    }
  }
}
