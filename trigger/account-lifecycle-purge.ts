import { logger, schedules } from '@trigger.dev/sdk';
import { AccountLifecycleService } from '@/lib/api/services/account-lifecycle.service';

export const purgeAccountLifecycle = schedules.task({
  id: 'account-lifecycle-purge',
  cron: {
    pattern: '15 3 * * *',
    timezone: 'Asia/Calcutta',
  },
  maxDuration: 120,
  run: async () => {
    const result = await AccountLifecycleService.purgeDueAccounts();
    logger.info('Account lifecycle purge completed', result);
    return result;
  },
});
