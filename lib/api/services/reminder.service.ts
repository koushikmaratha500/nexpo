import { GroupMemberRole, ReminderStatus } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler';
import { ReminderRepository } from '../repositories/reminder.repository';
import { GroupService } from './group.service';
import { NotificationService } from './notification.service';
import { SettingsService } from './settings.service';
import type { CreateReminderDto, UpdateReminderDto } from '../dtos/reminder.dto';

const ALLOWED_CHANNELS = new Set(['IN_APP', 'EMAIL', 'PUSH', 'WHATSAPP']);

export class ReminderService {
  static async listPersonal(
    userId: string,
    params: { from?: Date; to?: Date; page?: number; pageSize?: number },
  ) {
    const result = await ReminderRepository.findPersonal({ userId, ...params });
    return {
      items: ReminderRepository.serializeItems(result.items as Record<string, unknown>[]),
      total: result.total,
    };
  }

  static async listGroup(
    groupId: string,
    userId: string,
    params: { from?: Date; to?: Date; page?: number; pageSize?: number },
  ) {
    await GroupService.assertMember(groupId, userId);
    const result = await ReminderRepository.findForGroup({ groupId, ...params });
    return {
      items: ReminderRepository.serializeItems(result.items as Record<string, unknown>[]),
      total: result.total,
    };
  }

  static async listUpcomingPersonal(userId: string, days = 7) {
    const items = await ReminderRepository.findUpcomingPersonal(userId, days);
    return ReminderRepository.serializeItems(items as Record<string, unknown>[]);
  }

  static async createPersonal(userId: string, data: CreateReminderDto) {
    await this.validateChannels(data.channels);

    const reminder = await ReminderRepository.create({
      userId,
      groupId: null,
      createdByUserId: userId,
      title: data.title.trim(),
      amount: data.amount ?? null,
      dueDate: data.dueDate,
      recurrence: data.recurrence,
      channels: data.channels,
      notes: data.notes ?? null,
      status: ReminderStatus.ACTIVE,
    });

    await NotificationService.notifyPersonalReminderCreated({
      userId,
      reminderId: reminder.id,
      title: reminder.title,
      dueDate: reminder.dueDate,
      amount: reminder.amount != null ? Number(reminder.amount) : null,
      channels: reminder.channels,
    });

    return ReminderRepository.serialize(reminder as Record<string, unknown>);
  }

  static async createGroup(groupId: string, userId: string, data: CreateReminderDto) {
    await GroupService.assertAdmin(groupId, userId);
    await this.validateChannels(data.channels);

    const reminder = await ReminderRepository.create({
      userId: null,
      groupId,
      createdByUserId: userId,
      title: data.title.trim(),
      amount: data.amount ?? null,
      dueDate: data.dueDate,
      recurrence: data.recurrence,
      channels: data.channels,
      notes: data.notes ?? null,
      status: ReminderStatus.ACTIVE,
    });

    await NotificationService.fanOutGroupReminder({
      reminderId: reminder.id,
      groupId,
      title: reminder.title,
      dueDate: reminder.dueDate,
      amount: reminder.amount != null ? Number(reminder.amount) : null,
      createdByUserId: userId,
      channels: reminder.channels,
    });

    return ReminderRepository.serialize(reminder as Record<string, unknown>);
  }

  static async updatePersonal(id: string, userId: string, data: UpdateReminderDto) {
    const existing = await ReminderRepository.findById(id);
    if (!existing || existing.userId !== userId || existing.groupId) {
      throw new HttpError(404, 'Reminder not found');
    }

    if (data.channels) {
      await this.validateChannels(data.channels);
    }

    const updated = await ReminderRepository.update(id, {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
      ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
      ...(data.channels !== undefined ? { channels: data.channels } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.snoozedUntil !== undefined ? { snoozedUntil: data.snoozedUntil } : {}),
      ...(data.status === 'SNOOZED' && data.snoozedUntil ? { snoozedUntil: data.snoozedUntil } : {}),
    });

    return ReminderRepository.serialize(updated as Record<string, unknown>);
  }

  static async updateGroup(groupId: string, id: string, userId: string, data: UpdateReminderDto) {
    await GroupService.assertAdmin(groupId, userId);

    const existing = await ReminderRepository.findById(id);
    if (!existing || existing.groupId !== groupId) {
      throw new HttpError(404, 'Reminder not found');
    }

    if (data.channels) {
      await this.validateChannels(data.channels);
    }

    const updated = await ReminderRepository.update(id, {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
      ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
      ...(data.channels !== undefined ? { channels: data.channels } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.snoozedUntil !== undefined ? { snoozedUntil: data.snoozedUntil } : {}),
    });

    return ReminderRepository.serialize(updated as Record<string, unknown>);
  }

  static async deletePersonal(id: string, userId: string) {
    const existing = await ReminderRepository.findById(id);
    if (!existing || existing.userId !== userId || existing.groupId) {
      throw new HttpError(404, 'Reminder not found');
    }

    await ReminderRepository.softCancel(id);
    return { success: true };
  }

  static async deleteGroup(groupId: string, id: string, userId: string) {
    await GroupService.assertAdmin(groupId, userId);

    const existing = await ReminderRepository.findById(id);
    if (!existing || existing.groupId !== groupId) {
      throw new HttpError(404, 'Reminder not found');
    }

    await ReminderRepository.softCancel(id);
    return { success: true };
  }

  private static async validateChannels(channels: string[]) {
    for (const channel of channels) {
      if (!ALLOWED_CHANNELS.has(channel)) {
        throw new HttpError(400, `Unsupported reminder channel: ${channel}`);
      }
    }

    for (const channel of ['IN_APP', 'EMAIL', 'PUSH'] as const) {
      if (!channels.includes(channel)) continue;
      const enabled = await SettingsService.isNotificationChannelGloballyEnabled(channel);
      if (!enabled) {
        throw new HttpError(400, `${channel} reminders are disabled by admin policy`);
      }
    }
  }
}
