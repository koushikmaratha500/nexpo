import { AccountLifecycleMode, Status } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { MonthlyMoneyDigestBuilder } from '@/lib/digest/aggregation/monthly-money';
import { countEligibleMonthlyDigestUsers, isUserEligibleForMonthlyDigest } from '@/lib/digest/eligibility';
import { resolveDigestPeriod } from '@/lib/digest/period';
import { renderMonthlyDigestEmail } from '@/lib/digest/render/render-monthly-digest';
import type { MonthlyDigestMode } from '@/lib/digest/types';
import type { MonthlyDigestDispatchDto } from '../dtos/monthly-digest.dto';
import { MonthlyDigestRepository } from '../repositories/monthly-digest.repository';
import {
  getMonthlyDigestBatchSize,
  getMonthlyDigestEmailLimit,
  getMonthlyDigestTestRecipient,
} from '../utils/monthlyDigestConfig';
import { EmailService } from './email.service';

function logDigest(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ...data }));
}

export class MonthlyDigestDispatchService {
  static async dispatch(body: MonthlyDigestDispatchDto, referenceDate = new Date()) {
    const period = resolveDigestPeriod(body.period, referenceDate);
    const mode: MonthlyDigestMode = body.mode;

    logDigest('monthly_digest_started', { period: period.periodKey, mode });

    const eligibleCount = await countEligibleMonthlyDigestUsers({
      requireResend: mode === 'production',
    });

    logDigest('monthly_digest_recipients_count', { period: period.periodKey, eligibleCount });

    if (mode === 'preview') {
      return {
        status: 'preview',
        period: period.periodKey,
        eligibleUsers: eligibleCount,
        limit: getMonthlyDigestEmailLimit(),
      };
    }

    if (mode === 'production' && eligibleCount > getMonthlyDigestEmailLimit()) {
      logDigest('monthly_digest_failed', {
        period: period.periodKey,
        reason: 'monthly_email_limit_exceeded',
        eligibleCount,
      });
      return {
        status: 'blocked',
        reason: 'monthly_email_limit_exceeded',
        eligibleUsers: eligibleCount,
        limit: getMonthlyDigestEmailLimit(),
      };
    }

    if (mode === 'test') {
      return this.runTestSend(body, period);
    }

    return this.runProduction(period);
  }

  private static async runTestSend(
    body: MonthlyDigestDispatchDto,
    period: ReturnType<typeof resolveDigestPeriod>,
  ) {
    const testTo = body.testRecipient ?? getMonthlyDigestTestRecipient();
    if (!testTo) {
      return { status: 'error', error: 'testRecipient or MONTHLY_DIGEST_TEST_RECIPIENT required' };
    }

    const userId = body.userId ?? (await this.findFirstEligibleUserId());
    if (!userId) {
      return { status: 'error', error: 'No eligible user found for test digest' };
    }

    const built = await MonthlyMoneyDigestBuilder.buildForUser(userId, period);
    if (!built.digest) {
      return { status: 'skipped', userId, reason: built.skipReason };
    }

    const rendered = await renderMonthlyDigestEmail(built.digest);
    const result = await EmailService.sendMonthlyDigestEmail({
      to: testTo,
      subject: `[Test] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `digest-test:${userId}:${period.periodKey}`,
    });

    return {
      status: result.success ? 'test_sent' : 'test_failed',
      userId,
      testRecipient: testTo,
      resendEmailId: result.success ? result.id : undefined,
    };
  }

  private static async runProduction(period: ReturnType<typeof resolveDigestPeriod>) {
    const batchSize = getMonthlyDigestBatchSize();
    let lastId: string | undefined;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    while (true) {
      const users = await prisma.user.findMany({
        where: {
          status: Status.A,
          accountLifecycleMode: AccountLifecycleMode.ACTIVE,
          email: { not: null },
          emailVerified: true,
          ...(lastId ? { id: { gt: lastId } } : {}),
        },
        orderBy: { id: 'asc' },
        take: batchSize * 2,
        select: { id: true },
      });

      if (users.length === 0) break;

      const outbound: Array<{
        userId: string;
        to: string;
        subject: string;
        html: string;
        text: string;
      }> = [];

      for (const user of users) {
        if (outbound.length >= batchSize) break;
        if (!(await isUserEligibleForMonthlyDigest(user.id, { requireResend: true }))) continue;

        const existing = await MonthlyDigestRepository.findDelivery(user.id, period.periodKey);
        if (
          existing?.status === 'SENT' ||
          existing?.status === 'SKIPPED' ||
          existing?.status === 'PROCESSING'
        ) {
          continue;
        }

        const claim = await MonthlyDigestRepository.claimForSend(user.id, period.periodKey);
        if (!claim) continue;

        const built = await MonthlyMoneyDigestBuilder.buildForUser(user.id, period);
        if (!built.digest) {
          await MonthlyDigestRepository.markSkipped(user.id, period.periodKey, built.skipReason ?? 'no_history');
          skipped += 1;
          continue;
        }

        const rendered = await renderMonthlyDigestEmail(built.digest);
        outbound.push({
          userId: user.id,
          to: built.digest.user.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        });
      }

      if (outbound.length > 0) {
        logDigest('monthly_digest_batch_started', {
          period: period.periodKey,
          count: outbound.length,
        });

        const batchResult = await EmailService.sendMonthlyDigestBatch(
          outbound.map((o) => ({
            to: o.to,
            subject: o.subject,
            html: o.html,
            text: o.text,
          })),
        );

        for (let i = 0; i < outbound.length; i++) {
          const item = outbound[i]!;
          const row = batchResult.results[i];
          if (row?.success && 'id' in row && row.id) {
            await MonthlyDigestRepository.markSent(item.userId, period.periodKey, row.id);
            sent += 1;
            logDigest('monthly_digest_email_sent', { period: period.periodKey, userId: item.userId });
          } else {
            const errMsg =
              row && 'error' in row && row.error instanceof Error
                ? row.error.message
                : 'Batch send failed';
            await MonthlyDigestRepository.markFailed(item.userId, period.periodKey, errMsg);
            failed += 1;
            logDigest('monthly_digest_email_failed', { period: period.periodKey, userId: item.userId });
          }
        }

        logDigest('monthly_digest_batch_completed', {
          period: period.periodKey,
          sent,
          failed,
          skipped,
        });
      }

      lastId = users[users.length - 1]!.id;
    }

    logDigest('monthly_digest_completed', { period: period.periodKey, sent, failed, skipped });

    return { status: 'completed', period: period.periodKey, sent, failed, skipped };
  }

  private static async findFirstEligibleUserId(): Promise<string | undefined> {
    const users = await prisma.user.findMany({
      where: {
        status: Status.A,
        accountLifecycleMode: AccountLifecycleMode.ACTIVE,
        email: { not: null },
        emailVerified: true,
      },
      take: 50,
      select: { id: true },
    });
    for (const u of users) {
      if (await isUserEligibleForMonthlyDigest(u.id, { requireResend: false })) {
        return u.id;
      }
    }
    return undefined;
  }

  static async previewForUser(userId: string, periodInput: MonthlyDigestDispatchDto['period']) {
    const period = resolveDigestPeriod(periodInput);
    const built = await MonthlyMoneyDigestBuilder.buildForUser(userId, period);
    if (!built.digest) {
      return { digest: null, skipReason: built.skipReason };
    }
    const rendered = await renderMonthlyDigestEmail(built.digest);
    return { digest: built.digest, html: rendered.html, subject: rendered.subject };
  }
}
