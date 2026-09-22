import { prisma } from '@/lib/prisma';
import type { BotChannel, BotRequest, BotRequestStatus, Prisma } from '@prisma/client';

export class BotRequestRepository {
  static async findByIdempotencyKey(idempotencyKey: string): Promise<BotRequest | null> {
    return prisma.botRequest.findUnique({ where: { idempotencyKey } });
  }

  static async create(data: {
    idempotencyKey: string;
    channel: BotChannel;
    externalMessageId: string;
    userId?: string | null;
    command?: string | null;
    payload?: Prisma.InputJsonValue;
  }): Promise<BotRequest> {
    return prisma.botRequest.create({
      data: {
        idempotencyKey: data.idempotencyKey,
        channel: data.channel,
        externalMessageId: data.externalMessageId,
        userId: data.userId ?? null,
        command: data.command ?? null,
        payload: data.payload ?? undefined,
        status: 'RECEIVED',
      },
    });
  }

  static async updateStatus(
    id: string,
    status: BotRequestStatus,
    result?: Prisma.InputJsonValue,
    error?: string | null,
  ): Promise<BotRequest> {
    return prisma.botRequest.update({
      where: { id },
      data: {
        status,
        ...(result !== undefined && { result }),
        ...(error !== undefined && { error }),
      },
    });
  }
}
