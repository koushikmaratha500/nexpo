import { SettingsRepository } from '../repositories/settings.repository';
import { isResendEnabled } from '../utils/emailConfig';
import type { SystemSettingsResponse, UpdateSystemSettingsDto } from '../dtos/settings.dto';
import { Prisma } from '@prisma/client';

const POLICY_KEYS = {
  baseCurrency: 'baseCurrency',
  matchingRate: 'matchingRate',
  requireReceipt: 'requireReceipt',
  autoApproveLimit: 'autoApproveLimit',
} as const;

const NOTIFICATION_KEYS = {
  pushEnabled: 'notifications.pushEnabled',
  emailRemindersEnabled: 'notifications.emailRemindersEnabled',
  inAppEnabled: 'notifications.inAppEnabled',
  defaultChannels: 'notifications.defaultChannels',
} as const;

export const DEFAULT_SYSTEM_SETTINGS: Omit<SystemSettingsResponse, 'resendEnabled'> = {
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
};

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asChannels(
  value: unknown,
  fallback: SystemSettingsResponse['notifications']['defaultChannels'],
): SystemSettingsResponse['notifications']['defaultChannels'] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }
  const allowed = new Set(['IN_APP', 'EMAIL', 'PUSH', 'WHATSAPP']);
  const channels = value.filter((item): item is 'IN_APP' | 'EMAIL' | 'PUSH' | 'WHATSAPP' =>
    typeof item === 'string' && allowed.has(item),
  );
  return channels.length > 0 ? channels : fallback;
}

function mapStoredSettings(rows: Array<{ key: string; value: unknown }>): Omit<SystemSettingsResponse, 'resendEnabled'> {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const defaults = DEFAULT_SYSTEM_SETTINGS;

  return {
    baseCurrency: asString(byKey.get(POLICY_KEYS.baseCurrency), defaults.baseCurrency),
    matchingRate: asNumber(byKey.get(POLICY_KEYS.matchingRate), defaults.matchingRate),
    requireReceipt: asBoolean(byKey.get(POLICY_KEYS.requireReceipt), defaults.requireReceipt),
    autoApproveLimit: asNumber(byKey.get(POLICY_KEYS.autoApproveLimit), defaults.autoApproveLimit),
    notifications: {
      pushEnabled: asBoolean(byKey.get(NOTIFICATION_KEYS.pushEnabled), defaults.notifications.pushEnabled),
      emailRemindersEnabled: asBoolean(
        byKey.get(NOTIFICATION_KEYS.emailRemindersEnabled),
        defaults.notifications.emailRemindersEnabled,
      ),
      inAppEnabled: asBoolean(byKey.get(NOTIFICATION_KEYS.inAppEnabled), defaults.notifications.inAppEnabled),
      defaultChannels: asChannels(
        byKey.get(NOTIFICATION_KEYS.defaultChannels),
        defaults.notifications.defaultChannels,
      ),
    },
  };
}

export class SettingsService {
  static async getSettings(): Promise<SystemSettingsResponse> {
    const rows = await SettingsRepository.findAll();
    return {
      ...mapStoredSettings(rows),
      resendEnabled: isResendEnabled(),
    };
  }

  static async updateSettings(data: UpdateSystemSettingsDto, adminId: string): Promise<SystemSettingsResponse> {
    const entries: Array<{ key: string; value: Prisma.InputJsonValue }> = [];

    if (data.baseCurrency !== undefined) {
      entries.push({ key: POLICY_KEYS.baseCurrency, value: data.baseCurrency });
    }
    if (data.matchingRate !== undefined) {
      entries.push({ key: POLICY_KEYS.matchingRate, value: data.matchingRate });
    }
    if (data.requireReceipt !== undefined) {
      entries.push({ key: POLICY_KEYS.requireReceipt, value: data.requireReceipt });
    }
    if (data.autoApproveLimit !== undefined) {
      entries.push({ key: POLICY_KEYS.autoApproveLimit, value: data.autoApproveLimit });
    }

    if (data.notifications?.pushEnabled !== undefined) {
      entries.push({ key: NOTIFICATION_KEYS.pushEnabled, value: data.notifications.pushEnabled });
    }
    if (data.notifications?.emailRemindersEnabled !== undefined) {
      entries.push({
        key: NOTIFICATION_KEYS.emailRemindersEnabled,
        value: data.notifications.emailRemindersEnabled,
      });
    }
    if (data.notifications?.inAppEnabled !== undefined) {
      entries.push({ key: NOTIFICATION_KEYS.inAppEnabled, value: data.notifications.inAppEnabled });
    }
    if (data.notifications?.defaultChannels !== undefined) {
      entries.push({
        key: NOTIFICATION_KEYS.defaultChannels,
        value: data.notifications.defaultChannels,
      });
    }

    if (entries.length > 0) {
      await SettingsRepository.upsertMany(entries, adminId);
    }

    return this.getSettings();
  }

  static async isNotificationChannelGloballyEnabled(
    channel: 'IN_APP' | 'EMAIL' | 'PUSH',
  ): Promise<boolean> {
    const settings = await this.getSettings();
    if (channel === 'IN_APP') return settings.notifications.inAppEnabled;
    if (channel === 'EMAIL') return settings.notifications.emailRemindersEnabled && settings.resendEnabled;
    return settings.notifications.pushEnabled;
  }
}
