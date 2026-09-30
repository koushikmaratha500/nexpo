import { prisma } from '@/lib/prisma';
import type { Prisma, SmsIngestStatus, UserSmsImportSettings } from '@prisma/client';

export class SmsImportRepository {
  static async getOrCreateSettings(userId: string): Promise<UserSmsImportSettings> {
    const existing = await prisma.userSmsImportSettings.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }
    return prisma.userSmsImportSettings.create({ data: { userId } });
  }

  static async updateSettings(
    userId: string,
    data: Prisma.UserSmsImportSettingsUpdateInput,
  ): Promise<UserSmsImportSettings> {
    await this.getOrCreateSettings(userId);
    return prisma.userSmsImportSettings.update({ where: { userId }, data });
  }

  static async findByMessageHash(userId: string, messageHash: string) {
    return prisma.smsIngestMessage.findUnique({
      where: { userId_messageHash: { userId, messageHash } },
    });
  }

  static async createMessage(data: {
    userId: string;
    deviceId: string;
    externalSmsId?: string | null;
    messageHash: string;
    sender: string;
    body: string;
    receivedAt: Date;
    status: SmsIngestStatus;
    skipReason?: string | null;
    syncBatchId: string;
  }) {
    return prisma.smsIngestMessage.create({ data });
  }

  static async updateMessageStatus(
    id: string,
    status: SmsIngestStatus,
    fields?: {
      skipReason?: string | null;
      botRequestId?: string | null;
      transactionId?: string | null;
    },
  ) {
    return prisma.smsIngestMessage.update({
      where: { id },
      data: {
        status,
        ...(fields?.skipReason !== undefined && { skipReason: fields.skipReason }),
        ...(fields?.botRequestId !== undefined && { botRequestId: fields.botRequestId }),
        ...(fields?.transactionId !== undefined && { transactionId: fields.transactionId }),
      },
    });
  }

  static async findByIdempotencyKey(userId: string, messageHash: string) {
    return prisma.smsIngestMessage.findFirst({
      where: { userId, messageHash },
    });
  }

  static async listPendingByBatch(syncBatchId: string) {
    return prisma.smsIngestMessage.findMany({
      where: { syncBatchId, status: 'PENDING' },
      orderBy: { receivedAt: 'asc' },
    });
  }

  static async countByBatch(syncBatchId: string) {
    const rows = await prisma.smsIngestMessage.groupBy({
      by: ['status'],
      where: { syncBatchId },
      _count: { status: true },
    });
    return rows;
  }

  static async findMessageByIdempotencyKey(idempotencyKey: string) {
    const suffix = idempotencyKey.replace(/^sms:[^:]+:/, '');
    return prisma.smsIngestMessage.findFirst({
      where: { messageHash: suffix },
      orderBy: { createdAt: 'desc' },
    });
  }
}
