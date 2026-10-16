import { AccountLifecycleMode, Status } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/api/services/notification.service';
import { isResendEnabled } from '@/lib/api/utils/emailConfig';

export type DigestEligibilityContext = {
  requireResend: boolean;
};

export async function isUserEligibleForMonthlyDigest(
  userId: string,
  ctx: DigestEligibilityContext = { requireResend: true },
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      status: true,
      email: true,
      emailVerified: true,
      accountLifecycleMode: true,
    },
  });

  if (!user?.email || !user.emailVerified) return false;
  if (user.status !== Status.A) return false;
  if (user.accountLifecycleMode !== AccountLifecycleMode.ACTIVE) return false;
  if (ctx.requireResend && !isResendEnabled()) return false;

  const effective = await NotificationService.getEffectivePreferences(userId);
  return effective.monthlyDigest;
}

export async function countEligibleMonthlyDigestUsers(
  ctx: DigestEligibilityContext = { requireResend: true },
): Promise<number> {
  if (ctx.requireResend && !isResendEnabled()) return 0;

  const users = await prisma.user.findMany({
    where: {
      status: Status.A,
      accountLifecycleMode: AccountLifecycleMode.ACTIVE,
      email: { not: null },
      emailVerified: true,
      OR: [
        { notificationPreference: null },
        {
          notificationPreference: {
            emailEnabled: true,
            monthlyDigestEnabled: true,
          },
        },
      ],
    },
    select: { id: true },
  });

  let count = 0;
  for (const u of users) {
    if (await isUserEligibleForMonthlyDigest(u.id, ctx)) count += 1;
  }
  return count;
}

export async function listEligibleMonthlyDigestUserIds(params: {
  cursor?: string;
  take: number;
  ctx?: DigestEligibilityContext;
}): Promise<{ userIds: string[]; nextCursor: string | null }> {
  const ctx = params.ctx ?? { requireResend: true };
  if (ctx.requireResend && !isResendEnabled()) {
    return { userIds: [], nextCursor: null };
  }

  const users = await prisma.user.findMany({
    where: {
      status: Status.A,
      accountLifecycleMode: AccountLifecycleMode.ACTIVE,
      email: { not: null },
      emailVerified: true,
      OR: [
        { notificationPreference: null },
        {
          notificationPreference: {
            emailEnabled: true,
            monthlyDigestEnabled: true,
          },
        },
      ],
      ...(params.cursor ? { id: { gt: params.cursor } } : {}),
    },
    orderBy: { id: 'asc' },
    take: params.take * 3,
    select: { id: true },
  });

  const userIds: string[] = [];
  for (const u of users) {
    if (userIds.length >= params.take) break;
    if (await isUserEligibleForMonthlyDigest(u.id, ctx)) {
      userIds.push(u.id);
    }
  }

  const nextCursor =
    users.length > 0 && userIds.length >= params.take ? users[users.length - 1]!.id : null;

  return { userIds, nextCursor };
}
