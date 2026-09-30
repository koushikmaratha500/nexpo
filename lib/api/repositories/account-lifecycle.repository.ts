import { prisma } from '@/lib/prisma';
import type { Prisma, User } from '@prisma/client';

export class AccountLifecycleRepository {
  static async findUserById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, status: { not: 'D' } },
    });
  }

  static async updateUserLifecycle(
    userId: string,
    data: Prisma.UserUncheckedUpdateInput,
  ): Promise<User> {
    return prisma.user.update({ where: { id: userId }, data });
  }

  static async markPersonalTransactionsForReset(userId: string, batchId: string): Promise<number> {
    const result = await prisma.transaction.updateMany({
      where: {
        userId,
        groupId: null,
        status: { not: 'D' },
      },
      data: {
        status: 'D',
        lifecycleBatchId: batchId,
      },
    });
    return result.count;
  }

  static async restoreResetBatch(userId: string, batchId: string): Promise<number> {
    const result = await prisma.transaction.updateMany({
      where: {
        userId,
        lifecycleBatchId: batchId,
        status: 'D',
      },
      data: {
        status: 'A',
        lifecycleBatchId: null,
      },
    });
    return result.count;
  }

  static async hardDeleteResetBatch(userId: string, batchId: string): Promise<number> {
    const transactions = await prisma.transaction.findMany({
      where: { userId, lifecycleBatchId: batchId },
      select: { id: true },
    });
    const ids = transactions.map((row) => row.id);
    if (ids.length === 0) {
      return 0;
    }

    await prisma.$transaction([
      prisma.transactionShare.deleteMany({ where: { transactionId: { in: ids } } }),
      prisma.groupExpenseSplit.deleteMany({ where: { transactionId: { in: ids } } }),
      prisma.recurringTransactionAction.deleteMany({ where: { transactionId: { in: ids } } }),
      prisma.transactionAudit.deleteMany({ where: { transactionId: { in: ids } } }),
      prisma.transaction.deleteMany({ where: { id: { in: ids } } }),
    ]);

    return ids.length;
  }

  static async clearPersonalImportArtifacts(userId: string) {
    await prisma.$transaction([
      prisma.transactionImportFingerprint.deleteMany({ where: { userId } }),
      prisma.smsIngestMessage.deleteMany({ where: { userId } }),
    ]);
  }

  static async listDueForPurge(now: Date) {
    return prisma.user.findMany({
      where: {
        accountLifecycleMode: { in: ['RESET_PENDING', 'DELETE_PENDING'] },
        accountLifecyclePurgeAt: { lte: now },
        status: { not: 'D' },
      },
      select: {
        id: true,
        accountLifecycleMode: true,
        accountLifecycleBatchId: true,
      },
    });
  }

  static async clearLifecycleFields(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        accountLifecycleMode: 'ACTIVE',
        accountLifecycleAt: null,
        accountLifecyclePurgeAt: null,
        accountLifecycleBatchId: null,
      },
    });
  }

  static async hardDeleteUser(userId: string) {
    await prisma.$transaction(async (tx) => {
      const ownedGroups = await tx.group.findMany({
        where: { createdById: userId },
        include: { members: true },
      });

      for (const group of ownedGroups) {
        const successor = group.members.find((member) => member.userId !== userId);
        if (successor) {
          await tx.group.update({
            where: { id: group.id },
            data: { createdById: successor.userId },
          });
        } else {
          const groupTxnIds = (
            await tx.transaction.findMany({
              where: { groupId: group.id },
              select: { id: true },
            })
          ).map((row) => row.id);

          if (groupTxnIds.length > 0) {
            await tx.transactionShare.deleteMany({ where: { transactionId: { in: groupTxnIds } } });
            await tx.groupExpenseSplit.deleteMany({ where: { transactionId: { in: groupTxnIds } } });
            await tx.recurringTransactionAction.deleteMany({
              where: { transactionId: { in: groupTxnIds } },
            });
            await tx.transactionAudit.deleteMany({ where: { transactionId: { in: groupTxnIds } } });
            await tx.transaction.deleteMany({ where: { id: { in: groupTxnIds } } });
          }

          await tx.paymentReminder.deleteMany({ where: { groupId: group.id } });
          await tx.groupInvite.deleteMany({ where: { groupId: group.id } });
          await tx.groupMember.deleteMany({ where: { groupId: group.id } });
          await tx.group.delete({ where: { id: group.id } });
        }
      }

      await tx.groupExpenseSplit.deleteMany({ where: { userId } });
      await tx.groupMember.deleteMany({ where: { userId } });
      await tx.groupInvite.deleteMany({ where: { invitedById: userId } });
      await tx.paymentReminder.deleteMany({
        where: { OR: [{ userId }, { createdByUserId: userId }] },
      });
      await tx.session.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.userAudit.deleteMany({ where: { userId } });

      const txnIds = (
        await tx.transaction.findMany({
          where: { userId },
          select: { id: true },
        })
      ).map((row) => row.id);

      if (txnIds.length > 0) {
        await tx.transactionShare.deleteMany({ where: { transactionId: { in: txnIds } } });
        await tx.groupExpenseSplit.deleteMany({ where: { transactionId: { in: txnIds } } });
        await tx.recurringTransactionAction.deleteMany({ where: { transactionId: { in: txnIds } } });
        await tx.transactionAudit.deleteMany({ where: { transactionId: { in: txnIds } } });
        await tx.transaction.deleteMany({ where: { id: { in: txnIds } } });
      }

      await tx.botRequest.deleteMany({ where: { userId } });
      await tx.aiUsage.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    });
  }

  static serializeLifecycle(user: User) {
    const purgeAt = user.accountLifecyclePurgeAt;
    const daysRemaining =
      purgeAt && user.accountLifecycleMode !== 'ACTIVE'
        ? Math.max(0, Math.ceil((purgeAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
        : null;

    return {
      mode: user.accountLifecycleMode,
      requested_at: user.accountLifecycleAt?.toISOString() ?? null,
      purge_at: purgeAt?.toISOString() ?? null,
      days_remaining: daysRemaining,
      can_restore:
        user.accountLifecycleMode !== 'ACTIVE' &&
        purgeAt !== null &&
        purgeAt.getTime() > Date.now(),
    };
  }
}
