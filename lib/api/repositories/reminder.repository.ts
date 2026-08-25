import { prisma } from '@/lib/prisma';
import { Prisma, ReminderStatus } from '@prisma/client';

export class ReminderRepository {
  static async create(data: Prisma.PaymentReminderUncheckedCreateInput) {
    return prisma.paymentReminder.create({ data });
  }

  static async findById(id: string) {
    return prisma.paymentReminder.findUnique({ where: { id } });
  }

  static async findPersonal(params: {
    userId: string;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { userId, from, to, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where: Prisma.PaymentReminderWhereInput = {
      userId,
      groupId: null,
      status: { in: [ReminderStatus.ACTIVE, ReminderStatus.SNOOZED] },
      NOT: {
        status: ReminderStatus.SNOOZED,
        snoozedUntil: { gt: now },
      },
      ...(from || to
        ? {
            dueDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.paymentReminder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.paymentReminder.count({ where }),
    ]);

    return { items, total };
  }

  static async findForGroup(params: {
    groupId: string;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { groupId, from, to, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where: Prisma.PaymentReminderWhereInput = {
      groupId,
      status: { not: ReminderStatus.CANCELLED },
      NOT: {
        status: ReminderStatus.SNOOZED,
        snoozedUntil: { gt: now },
      },
      ...(from || to
        ? {
            dueDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.paymentReminder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.paymentReminder.count({ where }),
    ]);

    return { items, total };
  }

  static async findAllAdmin(params: {
    page?: number;
    pageSize?: number;
    scope?: 'ALL' | 'PERSONAL' | 'GROUP';
    status?: ReminderStatus;
    search?: string;
  }) {
    const { page = 1, pageSize = 20, scope = 'ALL', status, search } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PaymentReminderWhereInput = {
      ...(scope === 'PERSONAL' ? { groupId: null } : {}),
      ...(scope === 'GROUP' ? { groupId: { not: null } } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.paymentReminder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { dueDate: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.paymentReminder.count({ where }),
    ]);

    return { items, total };
  }

  static async findByIdWithRelations(id: string) {
    return prisma.paymentReminder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  static async findDueForDispatch(dayStart: Date, dayEnd: Date) {
    const now = new Date();

    return prisma.paymentReminder.findMany({
      where: {
        status: ReminderStatus.ACTIVE,
        dueDate: { gte: dayStart, lte: dayEnd },
        NOT: {
          status: ReminderStatus.SNOOZED,
          snoozedUntil: { gt: now },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  static async findUpcomingPersonal(userId: string, days = 7) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);

    return prisma.paymentReminder.findMany({
      where: {
        userId,
        groupId: null,
        status: ReminderStatus.ACTIVE,
        dueDate: { gte: now, lte: end },
        NOT: {
          status: ReminderStatus.SNOOZED,
          snoozedUntil: { gt: now },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });
  }

  static async update(id: string, data: Prisma.PaymentReminderUncheckedUpdateInput) {
    return prisma.paymentReminder.update({ where: { id }, data });
  }

  static async softCancel(id: string) {
    return prisma.paymentReminder.update({
      where: { id },
      data: { status: ReminderStatus.CANCELLED },
    });
  }

  static serialize(reminder: Record<string, unknown>) {
    const amount = reminder.amount;
    return {
      ...reminder,
      amount:
        amount != null && typeof amount === 'object' ? Number(amount) : amount ?? null,
      dueDate:
        reminder.dueDate instanceof Date
          ? reminder.dueDate.toISOString()
          : reminder.dueDate,
      snoozedUntil:
        reminder.snoozedUntil instanceof Date
          ? reminder.snoozedUntil.toISOString()
          : reminder.snoozedUntil ?? null,
      createdAt:
        reminder.createdAt instanceof Date
          ? reminder.createdAt.toISOString()
          : reminder.createdAt,
      updatedAt:
        reminder.updatedAt instanceof Date
          ? reminder.updatedAt.toISOString()
          : reminder.updatedAt,
    };
  }

  static serializeItems(items: Record<string, unknown>[]) {
    return items.map((item) => this.serialize(item));
  }
}
