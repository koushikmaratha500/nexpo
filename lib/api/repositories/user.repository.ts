import { prisma } from '@/lib/prisma';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, status: { not: 'D' } },
      include: { country: true, currency: true },
    });
  }

  static async findByEmail(email: string) {
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

  static async create(data: any) {
    return prisma.user.create({
      data: {
        status: 'A',
        ...data,
      },
    });
  }

  static async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
