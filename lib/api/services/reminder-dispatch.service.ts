import { ReminderRecurrence } from '@prisma/client';
import { ReminderRepository } from '../repositories/reminder.repository';
import { NotificationService } from './notification.service';

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function advanceDueDate(dueDate: Date, recurrence: ReminderRecurrence) {
  const next = new Date(dueDate);
  if (recurrence === 'WEEKLY') {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === 'MONTHLY') {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export class ReminderDispatchService {
  static async dispatchDueReminders(referenceDate = new Date()) {
    const dayStart = startOfDay(referenceDate);
    const dayEnd = endOfDay(referenceDate);
    const reminders = await ReminderRepository.findDueForDispatch(dayStart, dayEnd);

    const summary = {
      processed: 0,
      inApp: 0,
      email: 0,
      push: 0,
      skipped: 0,
      recurringAdvanced: 0,
      items: [] as Array<{ reminderId: string; inApp: number; email: number; push: number; skipped: number }>,
    };

    for (const reminder of reminders) {
      const result = await NotificationService.dispatchDueReminder(reminder);
      summary.processed += 1;
      summary.inApp += result.inApp;
      summary.email += result.email;
      summary.push += result.push;
      summary.skipped += result.skipped;
      summary.items.push({ reminderId: reminder.id, ...result });

      if (reminder.recurrence !== ReminderRecurrence.NONE) {
        await ReminderRepository.update(reminder.id, {
          dueDate: advanceDueDate(reminder.dueDate, reminder.recurrence),
        });
        summary.recurringAdvanced += 1;
      }
    }

    return summary;
  }
}
