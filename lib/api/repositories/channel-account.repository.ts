import { prisma } from '@/lib/prisma';
import type { BotChannel, ChannelAccount, ChannelAccountStatus } from '@prisma/client';

export class ChannelAccountRepository {
  static async findByChannelAndExternalId(
    channel: BotChannel,
    externalUserId: string,
  ): Promise<ChannelAccount | null> {
    return prisma.channelAccount.findUnique({
      where: {
        channel_externalUserId: { channel, externalUserId },
      },
    });
  }

  static async upsertLinked(params: {
    userId: string;
    channel: BotChannel;
    externalUserId: string;
    externalPhone?: string | null;
    displayName?: string | null;
  }): Promise<ChannelAccount> {
    const now = new Date();
    return prisma.channelAccount.upsert({
      where: {
        channel_externalUserId: {
          channel: params.channel,
          externalUserId: params.externalUserId,
        },
      },
      create: {
        userId: params.userId,
        channel: params.channel,
        externalUserId: params.externalUserId,
        externalPhone: params.externalPhone ?? null,
        displayName: params.displayName ?? null,
        status: 'LINKED',
        linkedAt: now,
        lastSeenAt: now,
      },
      update: {
        userId: params.userId,
        status: 'LINKED',
        linkedAt: now,
        lastSeenAt: now,
        ...(params.externalPhone !== undefined && { externalPhone: params.externalPhone }),
        ...(params.displayName !== undefined && { displayName: params.displayName }),
      },
    });
  }

  static async touchLastSeen(id: string): Promise<void> {
    await prisma.channelAccount.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  static async updateStatus(id: string, status: ChannelAccountStatus): Promise<ChannelAccount> {
    return prisma.channelAccount.update({
      where: { id },
      data: { status },
    });
  }
}
