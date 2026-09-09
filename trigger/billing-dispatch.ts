import { logger, schedules } from '@trigger.dev/sdk';
import { BillingDispatchService } from '@/lib/api/services/billing-dispatch.service';

export const billingLifecycleDispatch = schedules.task({
  id: 'billing-lifecycle-dispatch',
  cron: {
    pattern: '0 8 * * *',
    timezone: 'Asia/Calcutta',
  },
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload) => {
    logger.info('Running billing lifecycle dispatch', {
      scheduledFor: payload.timestamp.toISOString(),
      lastRun: payload.lastTimestamp?.toISOString(),
    });

    const result = await BillingDispatchService.dispatch();
    logger.info('Billing lifecycle dispatch complete', result);
    return result;
  },
});
