import { prisma } from '@/lib/prisma';
import type { TransactionShare } from '@prisma/client';

export class TransactionShareRepository {
  static async create(params: {
    token: string;
    transactionId: string;
    createdById: string;
    expiresAt: Date;
  }): Promise<TransactionShare> {
    return prisma.transactionShare.create({ data: params });
  }

  static async findActiveByToken(token: string) {
    return prisma.transactionShare.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        transaction: { status: { not: 'D' } },
      },
      include: {
        transaction: {
          include: {
            category: true,
            currency: true,
            paymentType: true,
            group: { select: { name: true } },
            splits: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  static async revoke(id: string, createdById: string) {
    return prisma.transactionShare.updateMany({
      where: { id, createdById, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  static async listActiveForTransaction(transactionId: string, createdById: string) {
    return prisma.transactionShare.findMany({
      where: {
        transactionId,
        createdById,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async purgeExpired(before = new Date()) {
    const result = await prisma.transactionShare.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: before } }, { revokedAt: { not: null } }],
      },
    });
    return result.count;
  }
}
