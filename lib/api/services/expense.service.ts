import { ExpenseRepository } from '../repositories/expense.repository';
import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

async function resolveIdsForExpense(data: any) {
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

  // Fallback to first active category if still null
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

  return { categoryId, currencyId, paymentTypeId };
}

export class ExpenseService {
  static async createExpense(userId: string, data: any, meta = { ip: '', ua: '' }) {
    const resolved = await resolveIdsForExpense(data);

    if (!resolved.categoryId || !resolved.currencyId || !resolved.paymentTypeId) {
      throw new Error('Missing or invalid category, currency, or payment type configurations');
    }

    const titleVal = data.title || data.merchant || 'Expense Title';
    const expense = await ExpenseRepository.create({
      userId,
      categoryId: resolved.categoryId,
      currencyId: resolved.currencyId,
      paymentTypeId: resolved.paymentTypeId,
      title: titleVal,
      description: data.description || titleVal,
      amount: data.amount,
      expenseDate: data.expenseDate,
      notes: data.notes || null,
      receiptUrl: data.receiptUrl || null,
      receiptFileName: data.receiptFileName || null,
      receiptMimeType: data.receiptMimeType || null,
      receiptSize: data.receiptSize || null,
    });

    // Write audit log
    await prisma.expensesAudit.create({
      data: {
        expenseId: expense.id,
        action: AuditAction.CREATE,
        newValue: JSON.parse(JSON.stringify(expense)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return expense;
  }

  static async getExpenses(params: {
    userId?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    return ExpenseRepository.findAll(params);
  }

  static async getExpenseById(id: string, userId?: string) {
    const expense = await ExpenseRepository.findById(id, userId);
    if (!expense) {
      throw new Error('Expense not found');
    }
    return expense;
  }

  static async updateExpense(id: string, userId: string, data: any, meta = { ip: '', ua: '' }) {
    const original = await ExpenseRepository.findById(id, userId);
    if (!original) {
      throw new Error('Expense not found or unauthorized');
    }

    const resolved = await resolveIdsForExpense(data);
    const updateData = {
      ...data,
      ...(resolved.categoryId && { categoryId: resolved.categoryId }),
      ...(resolved.currencyId && { currencyId: resolved.currencyId }),
      ...(resolved.paymentTypeId && { paymentTypeId: resolved.paymentTypeId }),
    };

    if (data.title || data.merchant) {
      updateData.title = data.title || data.merchant;
    }

    // Clean resolved helpers out of data payload to match Prisma input
    delete updateData.category;
    delete updateData.currency;
    delete updateData.paymentType;
    delete updateData.merchant;

    const updated = await ExpenseRepository.update(id, updateData);

    // Write audit log
    await prisma.expensesAudit.create({
      data: {
        expenseId: id,
        action: AuditAction.UPDATE,
        oldValue: JSON.parse(JSON.stringify(original)),
        newValue: JSON.parse(JSON.stringify(updated)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return updated;
  }

  static async deleteExpense(id: string, userId: string, meta = { ip: '', ua: '' }) {
    const original = await ExpenseRepository.findById(id, userId);
    if (!original) {
      throw new Error('Expense not found or unauthorized');
    }

    await ExpenseRepository.softDelete(id);

    // Write audit log
    await prisma.expensesAudit.create({
      data: {
        expenseId: id,
        action: AuditAction.DELETE,
        oldValue: JSON.parse(JSON.stringify(original)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return { success: true };
  }
}
