import { logger, schedules } from '@trigger.dev/sdk';
import { MonthlyDigestDispatchService } from '@/lib/api/services/monthly-digest-dispatch.service';
import { isMonthlyDigestSchedulerEnabled } from '@/lib/api/utils/monthlyDigestConfig';

/** 1st of each month at 09:00 IST — sends digest for the previous calendar month. */
export const monthlyDigestDispatch = schedules.task({
  id: 'monthly-digest-dispatch',
  cron: {
    pattern: '0 9 1 * *',
    timezone: 'Asia/Calcutta',
  },
  maxDuration: 600,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 10_000,
    maxTimeoutInMs: 120_000,
    factor: 2,
  },
  run: async (payload) => {
    logger.info('Running monthly money digest dispatch', {
      scheduledFor: payload.timestamp.toISOString(),
      lastRun: payload.lastTimestamp?.toISOString(),
      schedulerEnabled: isMonthlyDigestSchedulerEnabled(),
    });

    if (!isMonthlyDigestSchedulerEnabled()) {
      logger.info(
        'Monthly digest scheduler is disabled (set MONTHLY_DIGEST_SCHEDULER_ENABLED=true in Trigger prod to go live)',
      );
      return { status: 'disabled', reason: 'MONTHLY_DIGEST_SCHEDULER_ENABLED is not true' };
    }

    const result = await MonthlyDigestDispatchService.dispatch(
      { period: 'previous_month', mode: 'production' },
      payload.timestamp,
    );

    logger.info('Monthly money digest dispatch finished', result);

    if (result.status === 'blocked') {
      const blocked = result as {
        reason: string;
        eligibleUsers: number;
        limit: number;
      };
      throw new Error(
        `Monthly digest blocked: ${blocked.reason} (eligible=${blocked.eligibleUsers}, limit=${blocked.limit})`,
      );
    }

    return result;
  },
});
