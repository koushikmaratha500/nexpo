import { prisma } from '@/lib/prisma';

export class SupportRepository {
  static async findById(id: string) {
    return prisma.supportTicket.findFirst({
      where: { id, status: { not: 'D' } },
    });
  }

  static async findAll(page = 1, pageSize = 5) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: { status: { not: 'D' } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count({
        where: { status: { not: 'D' } },
      }),
    ]);
    return { items, total };
  }

  static async create(data: any) {
    return prisma.supportTicket.create({
      data: {
        ...data,
        status: 'A',
      },
    });
  }

  static async update(id: string, data: any) {
    return prisma.supportTicket.update({
      where: { id },
      data,
    });
  }

  static async softDelete(id: string) {
    return prisma.supportTicket.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
