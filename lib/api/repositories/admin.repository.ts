import { prisma } from '@/lib/prisma';

export class AdminRepository {
  static async findById(id: string) {
    return prisma.admin.findFirst({
      where: { id, status: { not: 'D' } },
    });
  }

  static async findByEmail(email: string) {
    return prisma.admin.findFirst({
      where: { email, status: { not: 'D' } },
    });
  }

  static async findAll(page = 1, pageSize = 5) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.admin.findMany({
        where: { status: { not: 'D' } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.admin.count({
        where: { status: { not: 'D' } },
      }),
    ]);
    return { items, total };
  }

  static async create(data: any) {
    return prisma.admin.create({
      data: {
        ...data,
        status: 'A',
      },
    });
  }

  static async update(id: string, data: any) {
    return prisma.admin.update({
      where: { id },
      data,
    });
  }

  static async softDelete(id: string) {
    return prisma.admin.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
