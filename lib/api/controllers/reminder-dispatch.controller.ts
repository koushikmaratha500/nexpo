import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { ReminderDispatchService } from '../services/reminder-dispatch.service';

export class ReminderDispatchController extends BaseController {
  static async dispatch(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const dateParam = searchParams.get('date');
      const referenceDate = dateParam ? new Date(`${dateParam}T12:00:00`) : new Date();
      return ReminderDispatchService.dispatchDueReminders(referenceDate);
    }, { fallbackMessage: 'Failed to dispatch due reminders' });
  }
}
