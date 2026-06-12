import { DepositRepository } from '../repositories/deposit.repository';
import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

async function resolveIdsForDeposit(data: any) {
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

  let budgetDepositTypeId = data.budgetDepositTypeId || null;
  const depositTypeName = data.category || data.budgetDepositType || 'Other';
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

  let paymentTypeId = data.paymentTypeId || null;
  const paymentTypeName = data.type || data.paymentType || 'Account';
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

  return { currencyId, budgetDepositTypeId, paymentTypeId, budgetTypeId };
}

export class DepositService {
  static async createDeposit(userId: string, data: any, meta = { ip: '', ua: '' }) {
    const resolved = await resolveIdsForDeposit(data);

    if (!resolved.currencyId || !resolved.budgetDepositTypeId || !resolved.paymentTypeId || !resolved.budgetTypeId) {
      throw new Error('Missing or invalid deposit metadata configurations');
    }

    const deposit = await DepositRepository.create({
      userId,
      currencyId: resolved.currencyId,
      budgetDepositTypeId: resolved.budgetDepositTypeId,
      paymentTypeId: resolved.paymentTypeId,
      budgetTypeId: resolved.budgetTypeId,
      title: data.title,
      amount: data.amount,
      date: data.date,
      notes: data.notes || null,
      documentUrl: data.documentUrl || null,
      documentFileName: data.documentFileName || null,
      documentMimeType: data.documentMimeType || null,
      documentSize: data.documentSize || null,
    });

    // Write audit log
    await prisma.budgetAudit.create({
      data: {
        budgetId: deposit.id,
        action: AuditAction.CREATE,
        newValue: JSON.parse(JSON.stringify(deposit)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return deposit;
  }

  static async getDeposits(params: {
    userId?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    return DepositRepository.findAll(params);
  }

  static async getDepositById(id: string, userId?: string) {
    const deposit = await DepositRepository.findById(id, userId);
    if (!deposit) {
      throw new Error('Deposit not found');
    }
    return deposit;
  }

  static async updateDeposit(id: string, userId: string, data: any, meta = { ip: '', ua: '' }) {
    const original = await DepositRepository.findById(id, userId);
    if (!original) {
      throw new Error('Deposit not found or unauthorized');
    }

    const resolved = await resolveIdsForDeposit(data);
    const updateData = {
      ...data,
      ...(resolved.currencyId && { currencyId: resolved.currencyId }),
      ...(resolved.budgetDepositTypeId && { budgetDepositTypeId: resolved.budgetDepositTypeId }),
      ...(resolved.paymentTypeId && { paymentTypeId: resolved.paymentTypeId }),
      ...(resolved.budgetTypeId && { budgetTypeId: resolved.budgetTypeId }),
    };

    // Clean resolved helpers out of data payload to match Prisma input
    delete updateData.currency;
    delete updateData.category;
    delete updateData.type;
    delete updateData.paymentType;
    delete updateData.budgetType;

    const updated = await DepositRepository.update(id, updateData);

    // Write audit log
    await prisma.budgetAudit.create({
      data: {
        budgetId: id,
        action: AuditAction.UPDATE,
        oldValue: JSON.parse(JSON.stringify(original)),
        newValue: JSON.parse(JSON.stringify(updated)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return updated;
  }

  static async deleteDeposit(id: string, userId: string, meta = { ip: '', ua: '' }) {
    const original = await DepositRepository.findById(id, userId);
    if (!original) {
      throw new Error('Deposit not found or unauthorized');
    }

    await DepositRepository.softDelete(id);

    // Write audit log
    await prisma.budgetAudit.create({
      data: {
        budgetId: id,
        action: AuditAction.DELETE,
        oldValue: JSON.parse(JSON.stringify(original)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return { success: true };
  }
}
