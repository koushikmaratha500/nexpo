import { logger, schedules } from '@trigger.dev/sdk';
import { HealthService } from '@/lib/api/services/health.service';

export const dailyHealthCheck = schedules.task({
  id: 'daily-health-check',
  cron: {
    pattern: '0 6 * * *',
    timezone: 'Asia/Calcutta',
  },
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload) => {
    logger.info('Running daily health check', {
      scheduledFor: payload.timestamp.toISOString(),
      lastRun: payload.lastTimestamp?.toISOString(),
    });

    const report = await HealthService.check();
    logger.info('Health check complete', {
      status: report.status,
      checks: report.checks,
    });

    HealthService.assertHealthy(report);
    return report;
  },
});
