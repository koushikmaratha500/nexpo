import { prisma } from '@/lib/prisma';
import { SupportTicket, Prisma } from '@prisma/client';

export class SupportRepository {
  static async findById(id: string): Promise<SupportTicket | null> {
    return prisma.supportTicket.findFirst({
      where: { id, status: { not: 'D' } },
    });
  }

  static async findAll(page = 1, pageSize = 5, status?: string) {
    const skip = (page - 1) * pageSize;
    const where =
      status && status !== 'ALL'
        ? { status: status as SupportTicket['status'] }
        : { status: { not: 'D' as const } };

    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count({ where }),
    ]);
    return { items, total };
  }

  static async countActive(): Promise<number> {
    return prisma.supportTicket.count({ where: { status: 'A' } });
  }

  static async create(data: Prisma.SupportTicketUncheckedCreateInput): Promise<SupportTicket> {
    return prisma.supportTicket.create({
      data: {
        ...data,
        status: 'A',
      },
    });
  }

  static async update(id: string, data: Prisma.SupportTicketUncheckedUpdateInput): Promise<SupportTicket> {
    return prisma.supportTicket.update({
      where: { id },
      data,
    });
  }

  static async softDelete(id: string): Promise<SupportTicket> {
    return prisma.supportTicket.update({
      where: { id },
      data: { status: 'D' },
    });
  }

  static async createAudit(data: Prisma.SupportTicketAuditUncheckedCreateInput) {
    return prisma.supportTicketAudit.create({ data });
  }
}
