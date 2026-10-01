import { TransactionRepository } from '../repositories/transaction.repository';
import { MetaResolutionService } from './meta-resolution.service';
import { MetaRepository } from '../repositories/meta.repository';
import { isIncomeCategoryName } from '@nexpo/shared';
import { PlanService } from './plan.service';
import { AuditAction, Prisma } from '@prisma/client';
import { createTransactionSchema } from '../dtos/transaction.dto';
import type { z } from 'zod';

type CreateTransactionData = z.infer<typeof createTransactionSchema>;

type TransactionData = CreateTransactionData & {
  expenseDate?: string | Date;
  date?: string | Date;
  receiptUrl?: string | null;
  receiptFileName?: string | null;
  receiptMimeType?: string | null;
  receiptSize?: number | null;
  categoryName?: string | null;
  depositType?: string | null;
};

interface TransactionMeta {
  ip?: string;
  ua?: string;
}

function normalizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveLedgerType(
  requested: 'DEBIT' | 'CREDIT',
  category: { type?: 'DEBIT' | 'CREDIT'; name: string } | null,
): 'DEBIT' | 'CREDIT' {
  if (isIncomeCategoryName(category?.name)) return 'CREDIT';
  if (category?.type === 'CREDIT' || category?.type === 'DEBIT') return category.type;
  return requested;
}

/** First calendar month (inclusive) that may surface a recurring due date. */
export function firstRecurringScheduleMonthYm(transactionDate: Date): number {
  const year = transactionDate.getFullYear();
  const month = transactionDate.getMonth();
  return year * 12 + month + 1;
}

export class TransactionService {
  static async createTransaction(userId: string, data: TransactionData, meta: TransactionMeta = {}) {
    await PlanService.assertCanCreatePersonalTransactions(userId, 1);
    const resolved = await MetaResolutionService.resolveForTransaction(data);
    const categoryRecord = resolved.categoryId
      ? await MetaRepository.findCategoryById(resolved.categoryId)
      : null;
    const resolvedType = resolveLedgerType(data.type, categoryRecord);

    const title = normalizeText(data.title) || normalizeText(data.merchant) || 'Transaction';
    const merchant = normalizeText(data.merchant);

    const transaction = await TransactionRepository.create({
      userId,
      type: resolvedType,
      categoryId: resolved.categoryId,
      currencyId: resolved.currencyId,
      paymentTypeId: resolved.paymentTypeId,
      budgetDepositTypeId: resolved.budgetDepositTypeId,
      budgetTypeId: resolved.budgetTypeId,
      title,
      description: data.description ?? merchant,
      amount: data.amount,
      transactionDate: data.transactionDate || data.expenseDate || data.date,
      notes: data.notes || null,
      documentUrl: data.documentUrl || data.receiptUrl || null,
      documentFileName: data.documentFileName || data.receiptFileName || null,
      documentMimeType: data.documentMimeType || data.receiptMimeType || null,
      documentSize: data.documentSize || data.receiptSize || null,
      merchant,
      isRecurring: data.isRecurring ?? false,
      recurringDay: data.isRecurring ? data.recurringDay ?? null : null,
    });

    await TransactionRepository.createAudit({
      transactionId: transaction.id,
      action: AuditAction.CREATE,
      newValue: JSON.parse(JSON.stringify(transaction)),
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
    });

    return transaction;
  }

  static async getTransactions(params: {
    userId?: string;
    groupId?: string | null;
    type?: 'DEBIT' | 'CREDIT';
    categoryId?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    return TransactionRepository.findAll(params);
  }

  static async getTransactionById(id: string, userId?: string) {
    const transaction = await TransactionRepository.findById(id, userId, true);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  static async updateTransaction(id: string, userId: string, data: Partial<TransactionData>, meta: TransactionMeta = {}) {
    await PlanService.assertWritesAllowed(userId);
    const original = await TransactionRepository.findById(id, userId, true);
    if (!original) {
      throw new Error('Transaction not found or unauthorized');
    }

    const resolved = await MetaResolutionService.resolveForTransaction({
      ...data,
      type: data.type ?? original.type,
    });
    const categoryRecord = resolved.categoryId
      ? await MetaRepository.findCategoryById(resolved.categoryId)
      : null;
    const resolvedType = resolveLedgerType(
      (data.type ?? original.type) as 'DEBIT' | 'CREDIT',
      categoryRecord,
    );

    const updatePayload: Prisma.TransactionUncheckedUpdateInput = {};

    if (data.type !== undefined || categoryRecord?.type) updatePayload.type = resolvedType;
    if (data.amount !== undefined) updatePayload.amount = data.amount;
    if (data.transactionDate !== undefined) updatePayload.transactionDate = data.transactionDate;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.documentUrl !== undefined) updatePayload.documentUrl = data.documentUrl;
    if (data.documentFileName !== undefined) updatePayload.documentFileName = data.documentFileName;
    if (data.documentMimeType !== undefined) updatePayload.documentMimeType = data.documentMimeType;
    if (data.documentSize !== undefined) updatePayload.documentSize = data.documentSize;

    if (data.title !== undefined) {
      updatePayload.title = normalizeText(data.title) || normalizeText(data.merchant) || original.title;
    }
    if (data.merchant !== undefined) {
      updatePayload.merchant = normalizeText(data.merchant);
    }

    if (resolved.categoryId) updatePayload.categoryId = resolved.categoryId;
    if (resolved.currencyId) updatePayload.currencyId = resolved.currencyId;
    if (resolved.paymentTypeId) updatePayload.paymentTypeId = resolved.paymentTypeId;
    if (resolved.budgetDepositTypeId) updatePayload.budgetDepositTypeId = resolved.budgetDepositTypeId;
    if (resolved.budgetTypeId) updatePayload.budgetTypeId = resolved.budgetTypeId;

    if (data.isRecurring !== undefined) {
      updatePayload.isRecurring = data.isRecurring;
      updatePayload.recurringDay = data.isRecurring ? data.recurringDay ?? null : null;
    } else if (data.recurringDay !== undefined) {
      updatePayload.recurringDay = data.recurringDay;
    }

    const updated = await TransactionRepository.update(id, updatePayload);

    await TransactionRepository.createAudit({
      transactionId: id,
      action: AuditAction.UPDATE,
      oldValue: JSON.parse(JSON.stringify(original)),
      newValue: JSON.parse(JSON.stringify(updated)),
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
    });

    return updated;
  }

  static async deleteTransaction(id: string, userId: string, meta: TransactionMeta = {}) {
    await PlanService.assertWritesAllowed(userId);
    const original = await TransactionRepository.findById(id, userId, true);
    if (!original) {
      throw new Error('Transaction not found or unauthorized');
    }

    await TransactionRepository.softDelete(id);

    await TransactionRepository.createAudit({
      transactionId: id,
      action: AuditAction.DELETE,
      oldValue: JSON.parse(JSON.stringify(original)),
      ipAddress: meta.ip || null,
      userAgent: meta.ua || null,
    });

    return { success: true };
  }

  /* --------------------------- Recurring support --------------------------- */

  private static monthDayClamped(year: number, month: number, day: number): number {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.min(day, lastDay);
  }

  /**
   * Returns the recurring occurrences that are currently pending approval for
   * the user. A recurring transaction surfaces on the single-month window that
   * starts 2 days before that month's due date and runs until 2 days before the
   * next month's due date. Occurrences already approved are excluded.
   */
  static async getPendingRecurring(userId: string) {
    const recurring = await TransactionRepository.findRecurring(userId);
    if (recurring.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedActions = await TransactionRepository.findRecurringActions(userId);
    const approvedKeys = new Set(
      approvedActions.map((a) => {
        const d = a.dueDate;
        return `${a.transactionId}:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      })
    );

    const pending: Array<Record<string, unknown>> = [];

    for (const txn of recurring) {
      const recurringDay = txn.recurringDay ?? txn.transactionDate.getDate();
      const firstScheduleYm = firstRecurringScheduleMonthYm(txn.transactionDate);
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      let activeDue: Date | null = null;

      for (let ym = firstScheduleYm; ym <= currentYear * 12 + currentMonth; ym += 1) {
        const year = Math.floor(ym / 12);
        const month = ym % 12;
        const day = TransactionService.monthDayClamped(year, month, recurringDay);
        const due = new Date(year, month, day);
        const dayStart = new Date(due);
        dayStart.setHours(0, 0, 0, 0);
        const windowOpen = new Date(dayStart.getTime() - 2 * 24 * 60 * 60 * 1000);
        if (windowOpen.getTime() <= today.getTime()) {
          activeDue = dayStart;
        }
      }

      if (!activeDue) continue;

      if (approvedKeys.has(`${txn.id}:${activeDue.getFullYear()}-${activeDue.getMonth() + 1}-${activeDue.getDate()}`)) {
        continue;
      }

      pending.push({
        transactionId: txn.id,
        dueDate: activeDue,
        type: txn.type,
        title: txn.title,
        merchant: txn.merchant || null,
        category: txn.category?.name || txn.category?.code || null,
        amount: TransactionRepository.serializeAmount(txn as unknown as Record<string, unknown>),
        currency: txn.currency?.code || 'INR',
        paymentType: txn.paymentType?.name || null,
        notes: txn.notes || null,
        recurringDay: txn.recurringDay ?? txn.transactionDate.getDate(),
      });
    }

    return pending;
  }

  /**
   * Approves the given recurring occurrences, converting each into a real
   * one-time ledger transaction dated on its occurrence due date. Already
   * approved occurrences are skipped.
   */
  static async approveRecurring(
    userId: string,
    items: { transactionId: string; dueDate: Date }[],
    _meta: TransactionMeta = {}
  ) {
    await PlanService.assertCanCreatePersonalTransactions(userId, items.length);
    const normalized = items.map((item) => ({
      transactionId: item.transactionId,
      dueDate: new Date(item.dueDate),
    }));

    return TransactionRepository.approveRecurringBatch(userId, normalized, _meta);
  }
}
