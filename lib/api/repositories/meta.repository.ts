import { prisma } from '@/lib/prisma';

function toCode(name: string): string {
  return name.toUpperCase().replace(/\s+/g, '_').trim();
}

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

  static async getCustomerMetadata() {
    const [countries, currencies, categories, paymentTypes, budgetDepositTypes] = await Promise.all([
      prisma.country.findMany({
        where: { status: 'A' },
        orderBy: { name: 'asc' },
        include: { currency: true },
      }),
      this.getActiveCurrencies(),
      this.getActiveCategories(),
      this.getActivePaymentTypes(),
      this.getActiveBudgetDepositTypes(),
    ]);

    return { countries, currencies, categories, paymentTypes, budgetDepositTypes };
  }

  static async findCountryByName(name: string) {
    return prisma.country.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  static async findOrCreateCategory(name: string) {
    let category = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { code: { equals: name.toUpperCase() } },
        ],
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name,
          code: toCode(name),
          status: 'A',
        },
      });
    }

    return category;
  }

  static async getDefaultCategoryId(): Promise<string | null> {
    const defaultCat = await prisma.category.findFirst({ where: { status: 'A' } });
    return defaultCat?.id ?? null;
  }

  static async findOrCreateCurrency(code: string) {
    const normalized = code.toUpperCase();
    let currency = await prisma.currency.findUnique({ where: { code: normalized } });

    if (!currency) {
      currency = await prisma.currency.create({
        data: {
          code: normalized,
          name: normalized,
          symbol: '₹',
          status: 'A',
        },
      });
    }

    return currency;
  }

  static async findOrCreatePaymentType(name: string) {
    let paymentType = await prisma.paymentType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (!paymentType) {
      paymentType = await prisma.paymentType.create({
        data: {
          name,
          code: toCode(name),
          status: 'A',
        },
      });
    }

    return paymentType;
  }

  static async findOrCreateBudgetDepositType(name: string) {
    let depType = await prisma.budgetDepositType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (!depType) {
      depType = await prisma.budgetDepositType.create({
        data: {
          name,
          code: toCode(name),
          status: 'A',
        },
      });
    }

    return depType;
  }

  static async findOrCreateBudgetType(name: string) {
    let budType = await prisma.budgetType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (!budType) {
      budType = await prisma.budgetType.create({
        data: {
          name,
          code: toCode(name),
          status: 'A',
        },
      });
    }

    return budType;
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
