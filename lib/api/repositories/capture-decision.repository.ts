import { Prisma, type CaptureDecisionKind } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class CaptureDecisionRepository {
  static findByFingerprint(userId: string, fingerprint: string) {
    return prisma.captureDecision.findUnique({ where: { userId_fingerprint: { userId, fingerprint } } });
  }

  /** Creates the decision; returns null when one already exists for this fingerprint. */
  static async createIfAbsent(data: {
    userId: string;
    fingerprint: string;
    reference?: string | null;
    decision: CaptureDecisionKind;
  }) {
    try {
      return await prisma.captureDecision.create({
        data: { ...data, reference: data.reference ?? null },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null;
      throw error;
    }
  }

  static update(id: string, data: { decision?: CaptureDecisionKind; transactionId?: string | null }) {
    return prisma.captureDecision.update({ where: { id }, data });
  }

  static delete(id: string) {
    return prisma.captureDecision.delete({ where: { id } });
  }

  static listSince(userId: string, since: Date | null, cursor: string | null, take: number) {
    return prisma.captureDecision.findMany({
      where: { userId, ...(since ? { createdAt: { gte: since } } : {}) },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, fingerprint: true, reference: true },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  static savedByReferences(userId: string, references: string[]) {
    if (references.length === 0) return Promise.resolve([]);
    return prisma.captureDecision.findMany({
      where: { userId, decision: 'SAVED', reference: { in: references }, transactionId: { not: null } },
      select: { reference: true, transactionId: true },
    });
  }

  /** The user's recent distinct merchant → category choices (personal ledger only). */
  static async merchantHistory(userId: string, limit = 200) {
    const rows = await prisma.transaction.findMany({
      where: { userId, groupId: null, status: { not: 'D' }, merchant: { not: null }, categoryId: { not: null } },
      orderBy: { transactionDate: 'desc' },
      distinct: ['merchant'],
      take: limit,
      select: { merchant: true, category: { select: { name: true } } },
    });
    return rows
      .filter((r) => r.merchant && r.category?.name)
      .map((r) => ({ merchant: r.merchant as string, category: r.category!.name }));
  }

  /** Personal transactions that could be the same payment (same type and amount, ±1 day). */
  static findLedgerCandidates(userId: string, type: 'DEBIT' | 'CREDIT', amount: number, date: Date) {
    const day = 24 * 60 * 60 * 1000;
    return prisma.transaction.findMany({
      where: {
        userId,
        groupId: null,
        status: { not: 'D' },
        type,
        amount: new Prisma.Decimal(amount),
        transactionDate: { gte: new Date(date.getTime() - day), lte: new Date(date.getTime() + day) },
      },
      select: { id: true, merchant: true, title: true },
      take: 5,
    });
  }
}
