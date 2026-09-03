import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class CategoryRepository {
  static async findAllPaginated(page = 1, pageSize = 100) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where: { status: { not: 'D' } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.count({ where: { status: { not: 'D' } } }),
    ]);
    return { items, total };
  }

  static async findById(id: string) {
    return prisma.category.findFirst({
      where: { id, status: { not: 'D' } },
    });
  }

  static async findByNameOrCode(name: string, code: string, excludeId?: string) {
    return prisma.category.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [{ name }, { code }],
      },
    });
  }

  static async create(data: Prisma.CategoryUncheckedCreateInput) {
    return prisma.category.create({ data });
  }

  static async update(id: string, data: Prisma.CategoryUncheckedUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  }

  static async countLinkedTransactions(categoryId: string) {
    return prisma.transaction.count({
      where: { categoryId, status: { not: 'D' } },
    });
  }

  static async softDelete(id: string) {
    return prisma.category.update({
      where: { id },
      data: { status: 'D' },
    });
  }
}
