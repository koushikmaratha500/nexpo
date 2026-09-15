import { logger, schedules } from '@trigger.dev/sdk';
import { ReminderDispatchService } from '@/lib/api/services/reminder-dispatch.service';

export const reminderDueDispatch = schedules.task({
  id: 'reminder-due-dispatch',
  cron: {
    pattern: '0 7 * * *',
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
    logger.info('Running due reminder dispatch', {
      scheduledFor: payload.timestamp.toISOString(),
      lastRun: payload.lastTimestamp?.toISOString(),
    });

    const result = await ReminderDispatchService.dispatchDueReminders();
    logger.info('Due reminder dispatch complete', result);
    return result;
  },
});
