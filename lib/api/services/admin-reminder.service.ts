import { ReminderStatus } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler';
import { ReminderRepository } from '../repositories/reminder.repository';

function userSummary(user: {
  id: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
} | null | undefined) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName || '',
    email: user.email,
  };
}

function serializeAdminReminder(reminder: Record<string, unknown>) {
  const base = ReminderRepository.serialize(reminder);
  const group = reminder.group as { id: string; name: string } | null | undefined;
  const user = reminder.user as {
    id: string;
    username?: string | null;
    firstName: string;
    lastName?: string | null;
    email?: string | null;
  } | null | undefined;
  const createdBy = reminder.createdBy as {
    id: string;
    username?: string | null;
    firstName: string;
    lastName?: string | null;
    email?: string | null;
  };

  return {
    ...base,
    scope: group ? ('GROUP' as const) : ('PERSONAL' as const),
    group: group ? { id: group.id, name: group.name } : null,
    owner: userSummary(user),
    createdBy: userSummary(createdBy),
  };
}

export class AdminReminderService {
  static async listReminders(params: {
    page?: number;
    pageSize?: number;
    scope?: 'ALL' | 'PERSONAL' | 'GROUP';
    status?: ReminderStatus;
    search?: string;
  }) {
    const { items, total } = await ReminderRepository.findAllAdmin(params);
    return {
      items: items.map((item) => serializeAdminReminder(item as Record<string, unknown>)),
      total,
    };
  }

  static async getReminder(id: string) {
    const reminder = await ReminderRepository.findByIdWithRelations(id);
    if (!reminder) {
      throw new HttpError(404, 'Reminder not found');
    }
    return serializeAdminReminder(reminder as Record<string, unknown>);
  }
}
