import { prisma } from '@/lib/prisma';
import { MonthlyDigestDeliveryStatus, Prisma } from '@prisma/client';

export class MonthlyDigestRepository {
  static async findDelivery(userId: string, period: string) {
    return prisma.monthlyDigestDelivery.findUnique({
      where: { userId_period: { userId, period } },
    });
  }

  static async claimForSend(userId: string, period: string) {
    try {
      return await prisma.monthlyDigestDelivery.create({
        data: {
          userId,
          period,
          status: MonthlyDigestDeliveryStatus.PROCESSING,
          attemptCount: 1,
          lastAttemptAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.findDelivery(userId, period);
        if (
          existing?.status === MonthlyDigestDeliveryStatus.SENT ||
          existing?.status === MonthlyDigestDeliveryStatus.SKIPPED
        ) {
          return null;
        }
        if (existing?.status === MonthlyDigestDeliveryStatus.PROCESSING) {
          return null;
        }
        return prisma.monthlyDigestDelivery.update({
          where: { userId_period: { userId, period } },
          data: {
            status: MonthlyDigestDeliveryStatus.PROCESSING,
            attemptCount: { increment: 1 },
            lastAttemptAt: new Date(),
          },
        });
      }
      throw error;
    }
  }

  static async markSent(userId: string, period: string, resendEmailId: string) {
    return prisma.monthlyDigestDelivery.update({
      where: { userId_period: { userId, period } },
      data: {
        status: MonthlyDigestDeliveryStatus.SENT,
        resendEmailId,
        sentAt: new Date(),
        errorCode: null,
        errorMessage: null,
      },
    });
  }

  static async markFailed(userId: string, period: string, errorMessage: string, errorCode?: string) {
    return prisma.monthlyDigestDelivery.update({
      where: { userId_period: { userId, period } },
      data: {
        status: MonthlyDigestDeliveryStatus.FAILED,
        errorMessage,
        errorCode: errorCode ?? 'SEND_FAILED',
        lastAttemptAt: new Date(),
      },
    });
  }

  static async markSkipped(userId: string, period: string, reason: string) {
    return prisma.monthlyDigestDelivery.upsert({
      where: { userId_period: { userId, period } },
      create: {
        userId,
        period,
        status: MonthlyDigestDeliveryStatus.SKIPPED,
        errorMessage: reason,
      },
      update: {
        status: MonthlyDigestDeliveryStatus.SKIPPED,
        errorMessage: reason,
      },
    });
  }
}
