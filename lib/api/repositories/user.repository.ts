import { prisma } from '@/lib/prisma';
import { User, UserAudit, Prisma, Country, Currency } from '@prisma/client';
import { normalizeUsername } from '../utils/username';

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

  static async findByUsername(username: string): Promise<UserWithRelations | null> {
    return prisma.user.findFirst({
      where: {
        username: { equals: normalizeUsername(username), mode: 'insensitive' },
        status: { not: 'D' },
      },
      include: { country: true, currency: true },
    });
  }

  static async findByMobile(mobile: string): Promise<UserWithRelations | null> {
    return prisma.user.findFirst({
      where: { mobile, status: { not: 'D' } },
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
    const payload: Prisma.UserUncheckedCreateInput = {
      status: 'A',
      ...data,
    };

    if (payload.passwordHash && payload.lastPasswordChangedDate === undefined) {
      payload.lastPasswordChangedDate = new Date();
    }

    return prisma.user.create({ data: payload });
  }

  static async createAudit(data: Prisma.UserAuditUncheckedCreateInput): Promise<UserAudit> {
    return prisma.userAudit.create({ data });
  }

  static async update(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    const patch: Prisma.UserUncheckedUpdateInput = { ...data };

    if (patch.passwordHash !== undefined && patch.passwordHash !== null) {
      if (patch.lastPasswordChangedDate === undefined) {
        patch.lastPasswordChangedDate = new Date();
      }
    }

    return prisma.user.update({
      where: { id },
      data: patch,
    });
  }

  static async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
