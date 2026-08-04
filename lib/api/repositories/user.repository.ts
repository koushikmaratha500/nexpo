import { prisma } from '@/lib/prisma';
import { User, UserAudit, Prisma, Country, Currency } from '@prisma/client';

export type UserWithRelations = User & {
  country?: Country | null;
  currency?: Currency | null;
};

export class UserRepository {
  static async findById(id: string): Promise<UserWithRelations | null> {
    return prisma.user.findFirst({
      where: { id, status: { not: 'D' } },
      include: { country: true, currency: true },
    });
  }

  static async findByEmail(email: string): Promise<UserWithRelations | null> {
    return prisma.user.findFirst({
      where: { email, status: { not: 'D' } },
      include: { country: true, currency: true },
    });
  }

  static async findAll(page = 1, pageSize = 5) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where: { status: { not: 'D' } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { country: true, currency: true },
      }),
      prisma.user.count({
        where: { status: { not: 'D' } },
      }),
    ]);
    return { items, total };
  }

  static async countActive(): Promise<number> {
    return prisma.user.count({ where: { status: { not: 'D' } } });
  }

  static async create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return prisma.user.create({
      data: {
        status: 'A',
        ...data,
      },
    });
  }

  static async createAudit(data: Prisma.UserAuditUncheckedCreateInput): Promise<UserAudit> {
    return prisma.userAudit.create({ data });
  }

  static async update(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
