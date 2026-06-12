import { prisma } from '@/lib/prisma';

export class MetaRepository {
  static async getActiveCategories() {
    return prisma.category.findMany({
      where: { status: 'A' },
      orderBy: { name: 'asc' },
    });
  }

  static async getActiveCurrencies() {
    return prisma.currency.findMany({
      where: { status: 'A' },
      orderBy: { code: 'asc' },
    });
  }

  static async getActivePaymentTypes() {
    return prisma.paymentType.findMany({
      where: { status: 'A' },
      orderBy: { name: 'asc' },
    });
  }

  static async getActiveBudgetTypes() {
    return prisma.budgetType.findMany({
      where: { status: 'A' },
      orderBy: { name: 'asc' },
    });
  }

  static async getActiveBudgetDepositTypes() {
    return prisma.budgetDepositType.findMany({
      where: { status: 'A' },
      orderBy: { name: 'asc' },
    });
  }

  static async getActiveCountries() {
    return prisma.country.findMany({
      where: { status: 'A' },
      orderBy: { name: 'asc' },
    });
  }

  static async getUserAudits(userId: string, page = 1, pageSize = 5) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.userAudit.findMany({
        where: { userId, status: { not: 'D' } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userAudit.count({
        where: { userId, status: { not: 'D' } },
      }),
    ]);
    return { items, total };
  }

  static async getAdminSessions(adminId: string) {
    return prisma.session.findMany({
      where: { adminId, status: { not: 'D' } },
      orderBy: { loginTime: 'desc' },
      take: 10,
    });
  }
}
