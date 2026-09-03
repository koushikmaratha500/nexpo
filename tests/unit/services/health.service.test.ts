import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthRepository } from '@/lib/api/repositories/health.repository';
import { HealthService, summarizeHealth, type HealthCheck } from '@/lib/api/services/health.service';
import { PushService } from '@/lib/api/services/push.service';
import { isAiConfigured } from '@/lib/ai/config';
import { isResendEnabled } from '@/lib/api/utils/emailConfig';
import { isProductionEnv, kvPing } from '@/lib/api/utils/redisClient';

vi.mock('@/lib/api/repositories/health.repository', () => ({
  HealthRepository: { ping: vi.fn() },
}));

vi.mock('@/lib/api/utils/redisClient', () => ({
  isProductionEnv: vi.fn(),
  kvPing: vi.fn(),
}));

vi.mock('@/lib/api/utils/emailConfig', () => ({
  isResendEnabled: vi.fn(),
}));

vi.mock('@/lib/ai/config', () => ({
  isAiConfigured: vi.fn(),
}));

vi.mock('@/lib/api/services/push.service', () => ({
  PushService: { isConfigured: vi.fn() },
}));

const ping = vi.mocked(HealthRepository.ping);
const mockedKvPing = vi.mocked(kvPing);
const mockedIsProduction = vi.mocked(isProductionEnv);
const mockedIsResendEnabled = vi.mocked(isResendEnabled);
const mockedIsAiConfigured = vi.mocked(isAiConfigured);
const mockedPushConfigured = vi.mocked(PushService.isConfigured);

function check(name: string, status: HealthCheck['status'], required = false): HealthCheck {
  return { name, status, required, latencyMs: 1 };
}

describe('summarizeHealth', () => {
  it('is down when a required check is down', () => {
    expect(summarizeHealth([check('database', 'down', true), check('ai', 'ok')])).toBe('down');
  });

  it('is degraded when an optional check is not ok', () => {
    expect(summarizeHealth([check('database', 'ok', true), check('ai', 'degraded')])).toBe('degraded');
  });

  it('is ok when every check is ok', () => {
    expect(summarizeHealth([check('database', 'ok', true), check('ai', 'ok')])).toBe('ok');
  });
});

describe('HealthService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    ping.mockResolvedValue(undefined);
    mockedKvPing.mockResolvedValue({ configured: true, reachable: true });
    mockedIsProduction.mockReturnValue(false);
    mockedIsResendEnabled.mockReturnValue(false);
    mockedIsAiConfigured.mockReturnValue(true);
    mockedPushConfigured.mockReturnValue(false);
    delete process.env.ONESIGNAL_APP_ID;
    delete process.env.ONESIGNAL_REST_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.AI_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('reports ok when core dependencies are healthy', async () => {
    const report = await HealthService.check();
    expect(report.status).toBe('ok');
    expect(report.checks.map((item) => item.name)).toEqual(['database', 'redis', 'email', 'push', 'ai']);
  });

  it('is down when the database ping fails', async () => {
    ping.mockRejectedValue(new Error('connection refused'));
    const report = await HealthService.check();
    expect(report.status).toBe('down');
    expect(report.checks.find((item) => item.name === 'database')?.detail).toBe('connection refused');
  });

  it('requires Redis in production', async () => {
    mockedIsProduction.mockReturnValue(true);
    mockedKvPing.mockResolvedValue({ configured: false, reachable: false });
    const report = await HealthService.check();
    expect(report.status).toBe('down');
    expect(report.checks.find((item) => item.name === 'redis')?.status).toBe('down');
  });

  it('treats missing Resend key as down when email is enabled', async () => {
    mockedIsResendEnabled.mockReturnValue(true);
    delete process.env.RESEND_API_KEY;
    const report = await HealthService.check();
    expect(report.status).toBe('down');
    expect(report.checks.find((item) => item.name === 'email')?.status).toBe('down');
  });

  it('marks AI as degraded when the key is missing', async () => {
    mockedIsAiConfigured.mockReturnValue(false);
    const report = await HealthService.check();
    expect(report.status).toBe('degraded');
    expect(report.checks.find((item) => item.name === 'ai')?.status).toBe('degraded');
  });

  it('throws from assertHealthy only when the report is down', () => {
    expect(() =>
      HealthService.assertHealthy({
        status: 'degraded',
        checkedAt: new Date().toISOString(),
        checks: [check('ai', 'degraded')],
      }),
    ).not.toThrow();

    expect(() =>
      HealthService.assertHealthy({
        status: 'down',
        checkedAt: new Date().toISOString(),
        checks: [check('database', 'down', true)],
      }),
    ).toThrow(/Health check failed: database/);
  });
});
