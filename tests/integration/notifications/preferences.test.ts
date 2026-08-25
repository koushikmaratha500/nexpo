import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { NotificationService } from '@/lib/api/services/notification.service';
import { NotificationPreferenceRepository } from '@/lib/api/repositories/notification.repository';
import { SettingsService } from '@/lib/api/services/settings.service';

vi.mock('@/lib/api/repositories/notification.repository', () => ({
  NotificationRepository: {
    createInApp: vi.fn(),
    createManyInApp: vi.fn(),
    listForUser: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    logDelivery: vi.fn(),
    serializeItems: vi.fn((items) => items),
  },
  NotificationPreferenceRepository: {
    findByUserId: vi.fn(),
    upsert: vi.fn(),
  },
  PushSubscriptionRepository: {
    upsert: vi.fn(),
    findByUserIds: vi.fn(),
    findByUserId: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/settings.service', () => ({
  SettingsService: {
    getSettings: vi.fn(),
    isNotificationChannelGloballyEnabled: vi.fn(),
  },
}));

const mockedFindPrefs = vi.mocked(NotificationPreferenceRepository.findByUserId);
const mockedUpsertPrefs = vi.mocked(NotificationPreferenceRepository.upsert);
const mockedGetSettings = vi.mocked(SettingsService.getSettings);

describe('NotificationService preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFindPrefs.mockResolvedValue(null);
    mockedGetSettings.mockResolvedValue({
      baseCurrency: 'INR',
      matchingRate: 90,
      requireReceipt: true,
      autoApproveLimit: 100,
      notifications: {
        pushEnabled: true,
        emailRemindersEnabled: true,
        inAppEnabled: true,
        defaultChannels: ['IN_APP'],
      },
      resendEnabled: false,
    });
  });

  it('returns default preferences with admin policy overlay', async () => {
    const prefs = await NotificationService.getPreferences('user-1');

    expect(prefs.inAppEnabled).toBe(true);
    expect(prefs.adminPolicy.emailEnabled).toBe(false);
    expect(prefs.allowedChannels).toEqual(['IN_APP', 'PUSH']);
  });

  it('rejects enabling email when admin/resend policy blocks it', async () => {
    await expect(
      NotificationService.updatePreferences('user-1', { emailEnabled: true }),
    ).rejects.toThrow(HttpError);
  });

  it('persists allowed preference updates', async () => {
    mockedUpsertPrefs.mockResolvedValue({
      userId: 'user-1',
      inAppEnabled: false,
      emailEnabled: false,
      pushEnabled: true,
      groupActivity: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const prefs = await NotificationService.updatePreferences('user-1', {
      inAppEnabled: false,
    });

    expect(prefs.inAppEnabled).toBe(false);
    expect(mockedUpsertPrefs).toHaveBeenCalledWith('user-1', { inAppEnabled: false });
  });

  it('rejects push registration when admin disables push globally', async () => {
    mockedGetSettings.mockResolvedValue({
      baseCurrency: 'INR',
      matchingRate: 90,
      requireReceipt: true,
      autoApproveLimit: 100,
      notifications: {
        pushEnabled: false,
        emailRemindersEnabled: true,
        inAppEnabled: true,
        defaultChannels: ['IN_APP'],
      },
      resendEnabled: true,
    });

    await expect(
      NotificationService.registerPushSubscription('user-1', 'player-1', 'WEB'),
    ).rejects.toThrow('Push notifications are disabled by admin policy');
  });
});
