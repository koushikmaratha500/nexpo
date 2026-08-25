import { prisma } from '@/lib/prisma';
import { NotificationChannel, Prisma, PushPlatform } from '@prisma/client';

export class NotificationRepository {
  static async createInApp(data: Prisma.InAppNotificationUncheckedCreateInput) {
    return prisma.inAppNotification.create({ data });
  }

  static async createManyInApp(data: Prisma.InAppNotificationUncheckedCreateInput[]) {
    if (data.length === 0) return { count: 0 };
    return prisma.inAppNotification.createMany({ data });
  }

  static async listForUser(params: {
    userId: string;
    page?: number;
    pageSize?: number;
    unreadOnly?: boolean;
  }) {
    const { userId, page = 1, pageSize = 20, unreadOnly = false } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.InAppNotificationWhereInput = {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.inAppNotification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inAppNotification.count({ where }),
      prisma.inAppNotification.count({ where: { userId, readAt: null } }),
    ]);

    return { items, total, unreadCount };
  }

  static async markRead(id: string, userId: string) {
    return prisma.inAppNotification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  static async markAllRead(userId: string) {
    return prisma.inAppNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  static async logDelivery(data: {
    reminderId?: string;
    userId?: string;
    channel: NotificationChannel;
    status: string;
    error?: string | null;
  }) {
    return prisma.notificationDelivery.create({
      data: {
        reminderId: data.reminderId ?? null,
        userId: data.userId ?? null,
        channel: data.channel,
        status: data.status,
        error: data.error ?? null,
      },
    });
  }

  static async hasDelivery(params: {
    reminderId: string;
    channel: NotificationChannel;
    userId?: string;
    statuses?: string[];
  }) {
    const count = await prisma.notificationDelivery.count({
      where: {
        reminderId: params.reminderId,
        channel: params.channel,
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.statuses?.length ? { status: { in: params.statuses } } : {}),
      },
    });
    return count > 0;
  }

  static serializeNotification(notification: Record<string, unknown>) {
    return {
      ...notification,
      createdAt:
        notification.createdAt instanceof Date
          ? notification.createdAt.toISOString()
          : notification.createdAt,
      updatedAt:
        notification.updatedAt instanceof Date
          ? notification.updatedAt.toISOString()
          : notification.updatedAt,
      readAt:
        notification.readAt instanceof Date
          ? notification.readAt.toISOString()
          : notification.readAt ?? null,
    };
  }

  static serializeItems(items: Record<string, unknown>[]) {
    return items.map((item) => this.serializeNotification(item));
  }
}

export class NotificationPreferenceRepository {
  static async findByUserId(userId: string) {
    return prisma.userNotificationPreference.findUnique({ where: { userId } });
  }

  static async upsert(userId: string, data: Prisma.UserNotificationPreferenceUncheckedUpdateInput) {
    return prisma.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        inAppEnabled: typeof data.inAppEnabled === 'boolean' ? data.inAppEnabled : true,
        emailEnabled: typeof data.emailEnabled === 'boolean' ? data.emailEnabled : true,
        pushEnabled: typeof data.pushEnabled === 'boolean' ? data.pushEnabled : true,
        groupActivity: typeof data.groupActivity === 'boolean' ? data.groupActivity : true,
      },
      update: data,
    });
  }
}

export class PushSubscriptionRepository {
  static async upsert(params: {
    userId: string;
    onesignalPlayerId: string;
    platform: PushPlatform;
  }) {
    return prisma.userPushSubscription.upsert({
      where: { onesignalPlayerId: params.onesignalPlayerId },
      create: {
        userId: params.userId,
        onesignalPlayerId: params.onesignalPlayerId,
        platform: params.platform,
        lastSeenAt: new Date(),
      },
      update: {
        userId: params.userId,
        platform: params.platform,
        lastSeenAt: new Date(),
      },
    });
  }

  static async findByUserIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    return prisma.userPushSubscription.findMany({
      where: { userId: { in: userIds } },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.userPushSubscription.findMany({ where: { userId } });
  }
}
