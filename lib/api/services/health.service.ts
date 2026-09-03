import { isAiConfigured } from '@/lib/ai/config';
import { HealthRepository } from '../repositories/health.repository';
import { isResendEnabled } from '../utils/emailConfig';
import { isProductionEnv, kvPing } from '../utils/redisClient';
import { PushService } from './push.service';

function checkErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  required: boolean;
  latencyMs: number;
  detail?: string;
}

export interface HealthReport {
  status: HealthStatus;
  checkedAt: string;
  checks: HealthCheck[];
}

export function summarizeHealth(checks: HealthCheck[]): HealthStatus {
  if (checks.some((check) => check.required && check.status === 'down')) {
    return 'down';
  }
  if (checks.some((check) => check.status !== 'ok')) {
    return 'degraded';
  }
  return 'ok';
}

export class HealthService {
  static async check(): Promise<HealthReport> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkEmail(),
      this.checkPush(),
      this.checkAi(),
    ]);

    return {
      status: summarizeHealth(checks),
      checkedAt: new Date().toISOString(),
      checks,
    };
  }

  static assertHealthy(report: HealthReport): void {
    if (report.status !== 'down') return;
    const failed = report.checks
      .filter((check) => check.status === 'down')
      .map((check) => check.name)
      .join(', ');
    throw new Error(`Health check failed: ${failed || 'unknown dependency'}`);
  }

  private static async checkDatabase(): Promise<HealthCheck> {
    return this.measure('database', true, async () => {
      await HealthRepository.ping();
      return { status: 'ok', detail: 'reachable' };
    });
  }

  private static async checkRedis(): Promise<HealthCheck> {
    const required = isProductionEnv();
    return this.measure('redis', required, async () => {
      const ping = await kvPing();
      if (!ping.configured) {
        return {
          status: required ? 'down' : 'ok',
          detail: required ? 'Redis is required in production' : 'in-memory fallback',
        };
      }
      if (!ping.reachable) {
        return { status: 'down', detail: 'ping failed' };
      }
      return { status: 'ok', detail: 'reachable' };
    });
  }

  private static async checkEmail(): Promise<HealthCheck> {
    const required = isResendEnabled();
    return this.measure('email', required, async () => {
      if (!required) {
        return { status: 'ok', detail: 'Resend disabled' };
      }
      if (!process.env.RESEND_API_KEY?.trim()) {
        return { status: 'down', detail: 'ENABLE_RESEND=true but RESEND_API_KEY is missing' };
      }
      return { status: 'ok', detail: 'configured' };
    });
  }

  private static async checkPush(): Promise<HealthCheck> {
    return this.measure('push', false, async () => {
      const appId = process.env.ONESIGNAL_APP_ID?.trim();
      const apiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();
      if (!appId && !apiKey) {
        return { status: 'ok', detail: 'not configured' };
      }
      if (!PushService.isConfigured()) {
        return { status: 'degraded', detail: 'partial OneSignal configuration' };
      }
      return { status: 'ok', detail: 'configured' };
    });
  }

  private static async checkAi(): Promise<HealthCheck> {
    return this.measure('ai', false, async () => {
      if (process.env.AI_ENABLED === 'false') {
        return { status: 'ok', detail: 'disabled' };
      }
      if (!isAiConfigured()) {
        return { status: 'degraded', detail: 'OPENROUTER_API_KEY missing' };
      }
      return { status: 'ok', detail: 'configured' };
    });
  }

  private static async measure(
    name: string,
    required: boolean,
    run: () => Promise<{ status: HealthStatus; detail?: string }>,
  ): Promise<HealthCheck> {
    const started = Date.now();
    try {
      const result = await run();
      return { name, required, latencyMs: Date.now() - started, ...result };
    } catch (error) {
      return {
        name,
        required,
        status: 'down',
        latencyMs: Date.now() - started,
        detail: checkErrorMessage(error, 'check failed'),
      };
    }
  }
}
