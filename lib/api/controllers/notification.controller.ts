import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { NotificationService } from '../services/notification.service';
import {
  notificationListQuerySchema,
  updateNotificationPreferencesSchema,
  registerPushSubscriptionSchema,
} from '../dtos/notification.dto';

export class NotificationController extends BaseController {
  static async list(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = notificationListQuerySchema.parse({
        page: searchParams.get('page') ?? undefined,
        pageSize: searchParams.get('pageSize') ?? undefined,
        unreadOnly: searchParams.get('unreadOnly') ?? undefined,
      });
      return NotificationService.listNotifications(
        userId,
        query.page,
        query.pageSize,
        query.unreadOnly,
      );
    }, { fallbackMessage: 'Failed to fetch notifications' });
  }

  static async markRead(_req: NextRequest, id: string, userId: string) {
    return this.safeExecuteJson(async () => NotificationService.markRead(userId, id), {
      fallbackMessage: 'Failed to mark notification as read',
    });
  }

  static async markAllRead(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => NotificationService.markAllRead(userId), {
      fallbackMessage: 'Failed to mark notifications as read',
    });
  }

  static async getPreferences(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => NotificationService.getPreferences(userId), {
      fallbackMessage: 'Failed to fetch notification preferences',
    });
  }

  static async updatePreferences(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateNotificationPreferencesSchema.parse(body);
      return NotificationService.updatePreferences(userId, validated);
    }, { fallbackMessage: 'Failed to update notification preferences' });
  }

  static async registerPush(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = registerPushSubscriptionSchema.parse(body);
      return NotificationService.registerPushSubscription(
        userId,
        validated.playerId,
        validated.platform,
      );
    }, { status: 201, fallbackMessage: 'Failed to register push subscription' });
  }
}
