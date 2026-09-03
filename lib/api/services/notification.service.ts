import { NotificationChannel, type PaymentReminder } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler';
import {
  NotificationPreferenceRepository,
  NotificationRepository,
  PushSubscriptionRepository,
} from '../repositories/notification.repository';
import { GroupRepository } from '../repositories/group.repository';
import { UserRepository } from '../repositories/user.repository';
import { SettingsService } from './settings.service';
import { PushService } from './push.service';
import { EmailService } from './email.service';
import type { UpdateNotificationPreferencesDto } from '../dtos/notification.dto';

type DeliveryChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

const DEFAULT_PREFERENCES = {
  inAppEnabled: true,
  emailEnabled: true,
  pushEnabled: true,
  groupActivity: true,
};

export class NotificationService {
  static async getPreferences(userId: string) {
    const [stored, adminSettings] = await Promise.all([
      NotificationPreferenceRepository.findByUserId(userId),
      SettingsService.getSettings(),
    ]);

    const prefs = stored ?? DEFAULT_PREFERENCES;

    return {
      inAppEnabled: prefs.inAppEnabled,
      emailEnabled: prefs.emailEnabled,
      pushEnabled: prefs.pushEnabled,
      groupActivity: prefs.groupActivity,
      adminPolicy: {
        inAppEnabled: adminSettings.notifications.inAppEnabled,
        emailEnabled:
          adminSettings.notifications.emailRemindersEnabled && adminSettings.resendEnabled,
        pushEnabled: adminSettings.notifications.pushEnabled,
        resendEnabled: adminSettings.resendEnabled,
      },
      allowedChannels: this.buildAllowedChannels(prefs, adminSettings),
    };
  }

  static async updatePreferences(userId: string, data: UpdateNotificationPreferencesDto) {
    const adminSettings = await SettingsService.getSettings();

    if (data.inAppEnabled === true && !adminSettings.notifications.inAppEnabled) {
      throw new HttpError(400, 'In-app notifications are disabled by admin policy');
    }
    if (
      data.emailEnabled === true &&
      (!adminSettings.notifications.emailRemindersEnabled || !adminSettings.resendEnabled)
    ) {
      throw new HttpError(400, 'Email reminders are disabled by admin policy');
    }
    if (data.pushEnabled === true && !adminSettings.notifications.pushEnabled) {
      throw new HttpError(400, 'Push notifications are disabled by admin policy');
    }

    const updated = await NotificationPreferenceRepository.upsert(userId, data);
    const prefs = {
      inAppEnabled: updated.inAppEnabled,
      emailEnabled: updated.emailEnabled,
      pushEnabled: updated.pushEnabled,
      groupActivity: updated.groupActivity,
    };

    return {
      ...prefs,
      adminPolicy: {
        inAppEnabled: adminSettings.notifications.inAppEnabled,
        emailEnabled:
          adminSettings.notifications.emailRemindersEnabled && adminSettings.resendEnabled,
        pushEnabled: adminSettings.notifications.pushEnabled,
        resendEnabled: adminSettings.resendEnabled,
      },
      allowedChannels: this.buildAllowedChannels(prefs, adminSettings),
    };
  }

  static async registerPushSubscription(
    userId: string,
    playerId: string,
    platform: 'WEB' | 'IOS' | 'ANDROID',
  ) {
    const adminSettings = await SettingsService.getSettings();
    if (!adminSettings.notifications.pushEnabled) {
      throw new HttpError(400, 'Push notifications are disabled by admin policy');
    }

    const subscription = await PushSubscriptionRepository.upsert({
      userId,
      onesignalPlayerId: playerId,
      platform,
    });

    return {
      id: subscription.id,
      playerId: subscription.onesignalPlayerId,
      platform: subscription.platform,
    };
  }

  static async listNotifications(userId: string, page = 1, pageSize = 20, unreadOnly = false) {
    const result = await NotificationRepository.listForUser({ userId, page, pageSize, unreadOnly });
    return {
      items: NotificationRepository.serializeItems(result.items as Record<string, unknown>[]),
      total: result.total,
      unreadCount: result.unreadCount,
    };
  }

  static async markRead(userId: string, notificationId: string) {
    const result = await NotificationRepository.markRead(notificationId, userId);
    if (result.count === 0) {
      throw new HttpError(404, 'Notification not found');
    }
    return { success: true };
  }

  static async markAllRead(userId: string) {
    await NotificationRepository.markAllRead(userId);
    return { success: true };
  }

  static async notifyPersonalReminderCreated(params: {
    userId: string;
    reminderId: string;
    title: string;
    dueDate: Date;
    amount?: number | null;
    channels: string[];
  }) {
    const prefs = await this.getEffectivePreferences(params.userId);
    const body = params.amount
      ? `${params.title} due ${params.dueDate.toLocaleDateString()} · ₹${params.amount.toFixed(2)}`
      : `${params.title} due ${params.dueDate.toLocaleDateString()}`;

    if (params.channels.includes('IN_APP') && prefs.inApp) {
      await NotificationRepository.createInApp({
        userId: params.userId,
        type: 'REMINDER_CREATED',
        title: 'Reminder scheduled',
        body,
        payload: {
          reminderId: params.reminderId,
        },
      });
    }

    if (params.channels.includes('PUSH') && prefs.push) {
      await this.sendPushToUsers(
        [params.userId],
        {
          title: 'Reminder scheduled',
          body,
          data: {
            reminderId: params.reminderId,
          },
        },
        params.reminderId,
      );
    }
  }

  static async fanOutGroupReminder(params: {
    reminderId: string;
    groupId: string;
    title: string;
    dueDate: Date;
    amount?: number | null;
    createdByUserId: string;
    channels: string[];
  }) {
    const members = await GroupRepository.findByIdWithMembers(params.groupId);
    if (!members) return;

    const memberIds = members.members.map((member) => member.userId);
    const prefsByUser = await Promise.all(
      memberIds.map(async (memberId) => ({
        memberId,
        prefs: await this.getEffectivePreferences(memberId),
      })),
    );

    const body = params.amount
      ? `${params.title} due ${params.dueDate.toLocaleDateString()} · ₹${params.amount}`
      : `${params.title} due ${params.dueDate.toLocaleDateString()}`;

    const inAppRows = prefsByUser
      .filter(({ prefs }) => prefs.inApp && prefs.groupActivity && params.channels.includes('IN_APP'))
      .map(({ memberId }) => ({
        userId: memberId,
        type: 'GROUP_REMINDER',
        title: 'New group reminder',
        body,
        payload: {
          reminderId: params.reminderId,
          groupId: params.groupId,
        },
      }));

    if (inAppRows.length > 0) {
      await NotificationRepository.createManyInApp(inAppRows);
      await NotificationRepository.logDelivery({
        reminderId: params.reminderId,
        channel: NotificationChannel.IN_APP,
        status: 'SENT',
      });
    }

    if (params.channels.includes('PUSH')) {
      await this.sendPushToUsers(
        prefsByUser
          .filter(({ prefs }) => prefs.push)
          .map(({ memberId }) => memberId),
        {
          title: 'New group reminder',
          body,
          data: {
            reminderId: params.reminderId,
            groupId: params.groupId,
          },
        },
        params.reminderId,
      );
    }
  }

  static async sendPushToUsers(
    userIds: string[],
    payload: { title: string; body: string; data?: Record<string, string> },
    reminderId?: string,
  ) {
    if (userIds.length === 0) {
      return { sent: 0, skipped: true };
    }

    const globallyEnabled = await SettingsService.isNotificationChannelGloballyEnabled('PUSH');
    if (!globallyEnabled || !PushService.isConfigured()) {
      await NotificationRepository.logDelivery({
        reminderId,
        userId: userIds.length === 1 ? userIds[0] : undefined,
        channel: NotificationChannel.PUSH,
        status: 'SKIPPED',
        error: 'Push disabled or not configured',
      });
      return { sent: 0, skipped: true };
    }

    const subscriptions = await PushSubscriptionRepository.findByUserIds(userIds);
    if (subscriptions.length === 0) {
      await NotificationRepository.logDelivery({
        reminderId,
        userId: userIds.length === 1 ? userIds[0] : undefined,
        channel: NotificationChannel.PUSH,
        status: 'SKIPPED',
        error: 'No push subscriptions',
      });
      return { sent: 0, skipped: true };
    }

    try {
      const result = await PushService.send(userIds, payload);
      await NotificationRepository.logDelivery({
        reminderId,
        userId: userIds.length === 1 ? userIds[0] : undefined,
        channel: NotificationChannel.PUSH,
        status: 'SENT',
      });
      return result;
    } catch (error) {
      await NotificationRepository.logDelivery({
        reminderId,
        userId: userIds.length === 1 ? userIds[0] : undefined,
        channel: NotificationChannel.PUSH,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Push send failed',
      });
      throw error;
    }
  }

  static async getEffectivePreferences(userId: string) {
    const prefs = await this.getPreferences(userId);
    return {
      inApp: prefs.inAppEnabled && prefs.adminPolicy.inAppEnabled,
      email: prefs.emailEnabled && prefs.adminPolicy.emailEnabled,
      push: prefs.pushEnabled && prefs.adminPolicy.pushEnabled,
      groupActivity: prefs.groupActivity,
    };
  }

  static async dispatchDueReminder(reminder: PaymentReminder) {
    const targetUserIds = await this.resolveReminderTargets(reminder);
    const amount = reminder.amount != null ? Number(reminder.amount) : null;
    const body = amount
      ? `${reminder.title} is due today · ₹${amount.toFixed(2)}`
      : `${reminder.title} is due today`;

    const summary = { inApp: 0, email: 0, push: 0, skipped: 0 };

    for (const userId of targetUserIds) {
      const prefs = await this.getEffectivePreferences(userId);
      const isGroupReminder = Boolean(reminder.groupId);
      if (isGroupReminder && !prefs.groupActivity) {
        summary.skipped += 1;
        continue;
      }

      if (reminder.channels.includes('IN_APP') && prefs.inApp) {
        const alreadySent = await NotificationRepository.hasDelivery({
          reminderId: reminder.id,
          channel: NotificationChannel.IN_APP,
          userId,
          statuses: ['SENT'],
        });
        if (!alreadySent) {
          await NotificationRepository.createInApp({
            userId,
            type: reminder.groupId ? 'GROUP_REMINDER_DUE' : 'REMINDER_DUE',
            title: 'Reminder due today',
            body,
            payload: {
              reminderId: reminder.id,
              groupId: reminder.groupId,
            },
          });
          await NotificationRepository.logDelivery({
            reminderId: reminder.id,
            userId,
            channel: NotificationChannel.IN_APP,
            status: 'SENT',
          });
          summary.inApp += 1;
        } else {
          summary.skipped += 1;
        }
      }

      if (reminder.channels.includes('EMAIL')) {
        const alreadySent = await NotificationRepository.hasDelivery({
          reminderId: reminder.id,
          channel: NotificationChannel.EMAIL,
          userId,
          statuses: ['SENT', 'SKIPPED'],
        });
        if (!alreadySent) {
          if (prefs.email) {
            const user = await UserRepository.findById(userId);
            if (user?.email) {
              const result = await EmailService.sendReminderEmail(user.email, {
                title: reminder.title,
                amount,
                dueDate: reminder.dueDate,
                notes: reminder.notes,
              });
              await NotificationRepository.logDelivery({
                reminderId: reminder.id,
                userId,
                channel: NotificationChannel.EMAIL,
                status: result.success ? 'SENT' : 'FAILED',
                error: result.success ? null : 'Email send failed',
              });
              if (result.success) summary.email += 1;
              else summary.skipped += 1;
            } else {
              summary.skipped += 1;
            }
          } else {
            await NotificationRepository.logDelivery({
              reminderId: reminder.id,
              userId,
              channel: NotificationChannel.EMAIL,
              status: 'SKIPPED',
              error: 'Email disabled by policy or user preference',
            });
            summary.skipped += 1;
          }
        } else {
          summary.skipped += 1;
        }
      }

      if (reminder.channels.includes('PUSH') && prefs.push) {
        const alreadySent = await NotificationRepository.hasDelivery({
          reminderId: reminder.id,
          channel: NotificationChannel.PUSH,
          userId,
          statuses: ['SENT', 'SKIPPED'],
        });
        if (!alreadySent) {
          const pushResult = await this.sendPushToUsers(
            [userId],
            {
              title: 'Reminder due today',
              body,
              data: {
                reminderId: reminder.id,
                ...(reminder.groupId ? { groupId: reminder.groupId } : {}),
              },
            },
            reminder.id,
          );
          if (pushResult.skipped) summary.skipped += 1;
          else summary.push += pushResult.sent;
        } else {
          summary.skipped += 1;
        }
      }
    }

    return summary;
  }

  private static async resolveReminderTargets(reminder: PaymentReminder) {
    if (reminder.userId) {
      return [reminder.userId];
    }

    if (!reminder.groupId) {
      return [];
    }

    const group = await GroupRepository.findByIdWithMembers(reminder.groupId);
    return group?.members.map((member) => member.userId) ?? [];
  }

  private static buildAllowedChannels(
    prefs: {
      inAppEnabled: boolean;
      emailEnabled: boolean;
      pushEnabled: boolean;
    },
    adminSettings: Awaited<ReturnType<typeof SettingsService.getSettings>>,
  ): DeliveryChannel[] {
    const allowed: DeliveryChannel[] = [];
    if (prefs.inAppEnabled && adminSettings.notifications.inAppEnabled) allowed.push('IN_APP');
    if (
      prefs.emailEnabled &&
      adminSettings.notifications.emailRemindersEnabled &&
      adminSettings.resendEnabled
    ) {
      allowed.push('EMAIL');
    }
    if (prefs.pushEnabled && adminSettings.notifications.pushEnabled) allowed.push('PUSH');
    return allowed;
  }
}
