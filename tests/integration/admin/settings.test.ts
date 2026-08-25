import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsService, DEFAULT_SYSTEM_SETTINGS } from '@/lib/api/services/settings.service';
import { SettingsRepository } from '@/lib/api/repositories/settings.repository';

vi.mock('@/lib/api/repositories/settings.repository', () => ({
  SettingsRepository: {
    findAll: vi.fn(),
    upsertMany: vi.fn(),
  },
}));

vi.mock('@/lib/api/utils/emailConfig', () => ({
  isResendEnabled: vi.fn(() => false),
}));

const mockedFindAll = vi.mocked(SettingsRepository.findAll);
const mockedUpsertMany = vi.mocked(SettingsRepository.upsertMany);

describe('SettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFindAll.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns defaults when no rows exist', async () => {
    const settings = await SettingsService.getSettings();
    expect(settings.baseCurrency).toBe(DEFAULT_SYSTEM_SETTINGS.baseCurrency);
    expect(settings.notifications.defaultChannels).toEqual(['IN_APP']);
    expect(settings.resendEnabled).toBe(false);
  });

  it('merges stored values over defaults', async () => {
    mockedFindAll.mockResolvedValue([
      { key: 'baseCurrency', value: 'USD', updatedByAdminId: null, createdAt: new Date(), updatedAt: new Date() },
      { key: 'matchingRate', value: 80, updatedByAdminId: null, createdAt: new Date(), updatedAt: new Date() },
      { key: 'notifications.pushEnabled', value: false, updatedByAdminId: null, createdAt: new Date(), updatedAt: new Date() },
    ] as never);

    const settings = await SettingsService.getSettings();
    expect(settings.baseCurrency).toBe('USD');
    expect(settings.matchingRate).toBe(80);
    expect(settings.notifications.pushEnabled).toBe(false);
  });

  it('persists partial updates and returns merged settings', async () => {
    mockedFindAll.mockResolvedValue([
      { key: 'autoApproveLimit', value: 250, updatedByAdminId: 'admin-1', createdAt: new Date(), updatedAt: new Date() },
      { key: 'requireReceipt', value: false, updatedByAdminId: 'admin-1', createdAt: new Date(), updatedAt: new Date() },
      { key: 'notifications.inAppEnabled', value: false, updatedByAdminId: 'admin-1', createdAt: new Date(), updatedAt: new Date() },
    ] as never);

    const settings = await SettingsService.updateSettings(
      {
        requireReceipt: false,
        notifications: { inAppEnabled: false },
      },
      'admin-1',
    );

    expect(mockedUpsertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        { key: 'requireReceipt', value: false },
        { key: 'notifications.inAppEnabled', value: false },
      ]),
      'admin-1',
    );
    expect(settings.autoApproveLimit).toBe(250);
    expect(settings.requireReceipt).toBe(false);
    expect(settings.notifications.inAppEnabled).toBe(false);
  });

  it('blocks email channel when Resend is disabled', async () => {
    mockedFindAll.mockResolvedValue([
      { key: 'notifications.emailRemindersEnabled', value: true, updatedByAdminId: null, createdAt: new Date(), updatedAt: new Date() },
    ] as never);

    await expect(SettingsService.isNotificationChannelGloballyEnabled('EMAIL')).resolves.toBe(false);
  });
});
