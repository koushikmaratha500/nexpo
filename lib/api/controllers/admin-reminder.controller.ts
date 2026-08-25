import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { AdminReminderService } from '../services/admin-reminder.service';
import { adminReminderListQuerySchema } from '../dtos/admin-reminder.dto';

export class AdminReminderController extends BaseController {
  static async list(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = adminReminderListQuerySchema.parse(Object.fromEntries(searchParams.entries()));
      return AdminReminderService.listReminders(query);
    }, { fallbackMessage: 'Failed to fetch reminders' });
  }

  static async getById(_req: NextRequest, id: string) {
    return this.safeExecuteJson(async () => AdminReminderService.getReminder(id), {
      errorStatus: 404,
      fallbackMessage: 'Reminder not found',
    });
  }
}
