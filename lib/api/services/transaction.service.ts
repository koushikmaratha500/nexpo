import { TransactionRepository } from '../repositories/transaction.repository';
import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

async function resolveIdsForTransaction(data: any) {
  let categoryId = data.categoryId || null;
  const categoryName = data.category || data.categoryName;
  if (!categoryId && categoryName) {
    let category = await prisma.category.findFirst({
      where: { OR: [{ name: { equals: categoryName, mode: 'insensitive' } }, { code: { equals: categoryName.toUpperCase() } }] },
    });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          code: categoryName.toUpperCase().replace(/\s+/g, '_').trim(),
          status: 'A',
        },
      });
    }
    categoryId = category.id;
  }
  if (!categoryId) {
    const defaultCat = await prisma.category.findFirst({ where: { status: 'A' } });
    categoryId = defaultCat ? defaultCat.id : null;
  }

  let currencyId = data.currencyId || null;
  const currencyCode = data.currency || data.currencyCode || 'INR';
  if (!currencyId && currencyCode) {
    let currency = await prisma.currency.findUnique({
      where: { code: currencyCode.toUpperCase() },
    });
    if (!currency) {
      currency = await prisma.currency.create({
        data: {
          code: currencyCode.toUpperCase(),
          name: currencyCode.toUpperCase(),
          symbol: '₹',
          status: 'A',
        },
      });
    }
    currencyId = currency.id;
  }

  let paymentTypeId = data.paymentTypeId || null;
  const paymentTypeName = data.paymentType || data.paymentTypeName || 'Credit Card';
  if (!paymentTypeId && paymentTypeName) {
    let paymentType = await prisma.paymentType.findFirst({
      where: { name: { equals: paymentTypeName, mode: 'insensitive' } },
    });
    if (!paymentType) {
      paymentType = await prisma.paymentType.create({
        data: {
          name: paymentTypeName,
          code: paymentTypeName.toUpperCase().replace(/\s+/g, '_').trim(),
          status: 'A',
        },
      });
    }
    paymentTypeId = paymentType.id;
  }

  let budgetDepositTypeId = data.budgetDepositTypeId || null;
  const depositTypeName = data.budgetDepositType || data.category;
  if (!budgetDepositTypeId && depositTypeName) {
    let depType = await prisma.budgetDepositType.findFirst({
      where: { name: { equals: depositTypeName, mode: 'insensitive' } },
    });
    if (!depType) {
      depType = await prisma.budgetDepositType.create({
        data: {
          name: depositTypeName,
          code: depositTypeName.toUpperCase().replace(/\s+/g, '_').trim(),
          status: 'A',
        },
      });
    }
    budgetDepositTypeId = depType.id;
  }

  let budgetTypeId = data.budgetTypeId || null;
  const budgetTypeName = data.budgetType || 'Regular';
  if (!budgetTypeId && budgetTypeName) {
    let budType = await prisma.budgetType.findFirst({
      where: { name: { equals: budgetTypeName, mode: 'insensitive' } },
    });
    if (!budType) {
      budType = await prisma.budgetType.create({
        data: {
          name: budgetTypeName,
          code: budgetTypeName.toUpperCase().replace(/\s+/g, '_').trim(),
          status: 'A',
        },
      });
    }
    budgetTypeId = budType.id;
  }

  return { categoryId, currencyId, paymentTypeId, budgetDepositTypeId, budgetTypeId };
}

export class TransactionService {
  static async createTransaction(userId: string, data: any, meta = { ip: '', ua: '' }) {
    const resolved = await resolveIdsForTransaction(data);

    const transaction = await TransactionRepository.create({
      userId,
      type: data.type,
      categoryId: resolved.categoryId,
      currencyId: resolved.currencyId,
      paymentTypeId: resolved.paymentTypeId,
      budgetDepositTypeId: resolved.budgetDepositTypeId,
      budgetTypeId: resolved.budgetTypeId,
      title: data.title || data.merchant || 'Transaction Title',
      description: data.description || data.merchant,
      amount: data.amount,
      transactionDate: data.transactionDate || data.expenseDate || data.date,
      notes: data.notes || null,
      documentUrl: data.documentUrl || data.receiptUrl || null,
      documentFileName: data.documentFileName || data.receiptFileName || null,
      documentMimeType: data.documentMimeType || data.receiptMimeType || null,
      documentSize: data.documentSize || data.receiptSize || null,
      merchant: data.merchant || null,
    });

    await prisma.transactionAudit.create({
      data: {
        transactionId: transaction.id,
        action: AuditAction.CREATE,
        newValue: JSON.parse(JSON.stringify(transaction)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return transaction;
  }

  static async getTransactions(params: {
    userId?: string;
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
    const transaction = await TransactionRepository.findById(id, userId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  static async updateTransaction(id: string, userId: string, data: any, meta = { ip: '', ua: '' }) {
    const original = await TransactionRepository.findById(id, userId);
    if (!original) {
      throw new Error('Transaction not found or unauthorized');
    }

    const resolved = await resolveIdsForTransaction(data);
    const updateData = {
      ...data,
      ...(resolved.categoryId && { categoryId: resolved.categoryId }),
      ...(resolved.currencyId && { currencyId: resolved.currencyId }),
      ...(resolved.paymentTypeId && { paymentTypeId: resolved.paymentTypeId }),
      ...(resolved.budgetDepositTypeId && { budgetDepositTypeId: resolved.budgetDepositTypeId }),
      ...(resolved.budgetTypeId && { budgetTypeId: resolved.budgetTypeId }),
    };

    if (data.title || data.merchant) {
      updateData.title = data.title || data.merchant;
    }

    delete updateData.category;
    delete updateData.currency;
    delete updateData.paymentType;
    delete updateData.merchant;
    delete updateData.budgetDepositType;
    delete updateData.budgetType;
    delete updateData.categoryName;

    const updated = await TransactionRepository.update(id, updateData);

    await prisma.transactionAudit.create({
      data: {
        transactionId: id,
        action: AuditAction.UPDATE,
        oldValue: JSON.parse(JSON.stringify(original)),
        newValue: JSON.parse(JSON.stringify(updated)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return updated;
  }

  static async deleteTransaction(id: string, userId: string, meta = { ip: '', ua: '' }) {
    const original = await TransactionRepository.findById(id, userId);
    if (!original) {
      throw new Error('Transaction not found or unauthorized');
    }

    await TransactionRepository.softDelete(id);

    await prisma.transactionAudit.create({
      data: {
        transactionId: id,
        action: AuditAction.DELETE,
        oldValue: JSON.parse(JSON.stringify(original)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return { success: true };
  }
}
