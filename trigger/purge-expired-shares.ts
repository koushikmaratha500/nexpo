import { logger, schedules } from '@trigger.dev/sdk';
import { TransactionShareService } from '@/lib/api/services/transaction-share.service';

export const purgeExpiredReceiptShares = schedules.task({
  id: 'purge-expired-receipt-shares',
  cron: {
    pattern: '30 2 * * *',
    timezone: 'Asia/Calcutta',
  },
  maxDuration: 60,
  run: async () => {
    const removed = await TransactionShareService.purgeExpiredShares();
    logger.info('Purged expired receipt share links', { removed });
    return { removed };
  },
});
