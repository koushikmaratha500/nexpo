import { prisma } from '@/lib/prisma';
import type { PushPlatform } from '@prisma/client';

export class MobilePushTokenRepository {
  /** A token belongs to one phone: a new sign-in on that phone moves it to the new user. */
  static async upsert(userId: string, token: string, platform: PushPlatform) {
    return prisma.mobilePushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, lastSeenAt: new Date() },
    });
  }

  static async remove(userId: string, token: string) {
    return prisma.mobilePushToken.deleteMany({ where: { userId, token } });
  }

  static async deleteToken(token: string) {
    return prisma.mobilePushToken.deleteMany({ where: { token } });
  }

  static async tokensForUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const rows = await prisma.mobilePushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    return rows.map((r) => r.token);
  }
}
