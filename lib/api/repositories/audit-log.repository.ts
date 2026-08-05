import { prisma } from '@/lib/prisma';

export class AuditLogRepository {
  static async getUserAudits(userId: string, page = 1, pageSize = 5) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.userAudit.findMany({
        where: { userId, status: { not: 'D' } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userAudit.count({ where: { userId, status: { not: 'D' } } }),
    ]);
    return { items, total };
  }

  static async getTransactionAudits(userId: string, page = 1, pageSize = 5) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.transactionAudit.findMany({
        where: {
          transaction: { userId, status: { not: 'D' } },
          status: { not: 'D' },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: {
            select: { id: true, title: true, merchant: true, amount: true, type: true },
          },
        },
      }),
      prisma.transactionAudit.count({
        where: {
          transaction: { userId, status: { not: 'D' } },
          status: { not: 'D' },
        },
      }),
    ]);
    return { items, total };
  }

  static async getSupportTicketAudits(adminId: string, page = 1, pageSize = 100) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.supportTicketAudit.findMany({
        where: { adminId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicketAudit.count({ where: { adminId } }),
    ]);
    return { items, total };
  }

  static async getUserAuditsCount(userId: string): Promise<number> {
    return prisma.userAudit.count({ where: { userId, status: { not: 'D' } } });
  }

  static async getTransactionAuditsCount(userId: string): Promise<number> {
    return prisma.transactionAudit.count({
      where: {
        transaction: { userId, status: { not: 'D' } },
        status: { not: 'D' },
      },
    });
  }
}
