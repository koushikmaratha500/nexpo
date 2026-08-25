import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReminderDispatchService } from '@/lib/api/services/reminder-dispatch.service';
import { NotificationService } from '@/lib/api/services/notification.service';
import { ReminderRepository } from '@/lib/api/repositories/reminder.repository';

vi.mock('@/lib/api/repositories/reminder.repository', () => ({
  ReminderRepository: {
    findDueForDispatch: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/notification.service', () => ({
  NotificationService: {
    dispatchDueReminder: vi.fn(),
  },
}));

const mockedFindDue = vi.mocked(ReminderRepository.findDueForDispatch);
const mockedDispatch = vi.mocked(NotificationService.dispatchDueReminder);
const mockedUpdate = vi.mocked(ReminderRepository.update);

describe('ReminderDispatchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches all due reminders for the reference day', async () => {
    mockedFindDue.mockResolvedValue([
      {
        id: 'rem-1',
        title: 'Rent',
        dueDate: new Date('2026-09-01T10:00:00Z'),
        recurrence: 'NONE',
        channels: ['IN_APP'],
      },
    ] as never);
    mockedDispatch.mockResolvedValue({ inApp: 1, email: 0, push: 0, skipped: 0 });

    const summary = await ReminderDispatchService.dispatchDueReminders(new Date('2026-09-01T12:00:00Z'));

    expect(summary.processed).toBe(1);
    expect(summary.inApp).toBe(1);
    expect(mockedDispatch).toHaveBeenCalledTimes(1);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('advances recurring reminders after dispatch', async () => {
    mockedFindDue.mockResolvedValue([
      {
        id: 'rem-2',
        title: 'Utilities',
        dueDate: new Date('2026-09-01T10:00:00Z'),
        recurrence: 'MONTHLY',
        channels: ['IN_APP'],
      },
    ] as never);
    mockedDispatch.mockResolvedValue({ inApp: 1, email: 0, push: 0, skipped: 0 });

    const summary = await ReminderDispatchService.dispatchDueReminders(new Date('2026-09-01T12:00:00Z'));

    expect(summary.recurringAdvanced).toBe(1);
    expect(mockedUpdate).toHaveBeenCalledWith(
      'rem-2',
      expect.objectContaining({ dueDate: expect.any(Date) }),
    );
  });
});
