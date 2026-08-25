import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupMemberRole } from '@prisma/client';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { ReminderService } from '@/lib/api/services/reminder.service';
import { GroupService } from '@/lib/api/services/group.service';
import { NotificationService } from '@/lib/api/services/notification.service';
import { ReminderRepository } from '@/lib/api/repositories/reminder.repository';
import { SettingsService } from '@/lib/api/services/settings.service';

vi.mock('@/lib/api/repositories/reminder.repository', () => ({
  ReminderRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findPersonal: vi.fn(),
    findForGroup: vi.fn(),
    findUpcomingPersonal: vi.fn(),
    update: vi.fn(),
    softCancel: vi.fn(),
    serialize: vi.fn((item) => item),
    serializeItems: vi.fn((items) => items),
  },
}));

vi.mock('@/lib/api/services/group.service', () => ({
  GroupService: {
    assertMember: vi.fn(),
    assertAdmin: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/notification.service', () => ({
  NotificationService: {
    fanOutGroupReminder: vi.fn(),
    notifyPersonalReminderCreated: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/settings.service', () => ({
  SettingsService: {
    isNotificationChannelGloballyEnabled: vi.fn(),
  },
}));

const mockedCreate = vi.mocked(ReminderRepository.create);
const mockedFindById = vi.mocked(ReminderRepository.findById);
const mockedUpdate = vi.mocked(ReminderRepository.update);
const mockedSoftCancel = vi.mocked(ReminderRepository.softCancel);
const mockedAssertAdmin = vi.mocked(GroupService.assertAdmin);
const mockedFanOut = vi.mocked(NotificationService.fanOutGroupReminder);
const mockedNotifyPersonal = vi.mocked(NotificationService.notifyPersonalReminderCreated);
const mockedChannelEnabled = vi.mocked(SettingsService.isNotificationChannelGloballyEnabled);

describe('ReminderService CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedChannelEnabled.mockResolvedValue(true);
  });

  it('creates a personal reminder', async () => {
    mockedCreate.mockResolvedValue({
      id: 'rem-1',
      title: 'Rent',
      dueDate: new Date('2026-09-01'),
      channels: ['IN_APP'],
    } as never);

    const result = await ReminderService.createPersonal('user-1', {
      title: 'Rent',
      amount: 15000,
      dueDate: new Date('2026-09-01'),
      recurrence: 'MONTHLY',
      channels: ['IN_APP'],
    });

    expect((result as unknown as { id: string }).id).toBe('rem-1');
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        groupId: null,
        createdByUserId: 'user-1',
      }),
    );
    expect(mockedNotifyPersonal).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        reminderId: 'rem-1',
        title: 'Rent',
      }),
    );
  });

  it('blocks group reminder creation for non-admin members', async () => {
    mockedAssertAdmin.mockRejectedValue(new HttpError(403, 'Only group admins can perform this action'));

    await expect(
      ReminderService.createGroup('group-1', 'user-2', {
        title: 'Rent',
        dueDate: new Date('2026-09-01'),
        recurrence: 'NONE',
        channels: ['IN_APP'],
      }),
    ).rejects.toThrow('Only group admins can perform this action');
  });

  it('creates a group reminder and fans out notifications for admins', async () => {
    mockedAssertAdmin.mockResolvedValue({ role: GroupMemberRole.ADMIN } as never);
    mockedCreate.mockResolvedValue({
      id: 'rem-2',
      title: 'Utilities',
      dueDate: new Date('2026-09-05'),
      amount: 1200,
      channels: ['IN_APP'],
    } as never);

    await ReminderService.createGroup('group-1', 'user-1', {
      title: 'Utilities',
      dueDate: new Date('2026-09-05'),
      recurrence: 'NONE',
      channels: ['IN_APP'],
    });

    expect(mockedFanOut).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderId: 'rem-2',
        groupId: 'group-1',
      }),
    );
  });

  it('snoozes a personal reminder', async () => {
    mockedFindById.mockResolvedValue({
      id: 'rem-1',
      userId: 'user-1',
      groupId: null,
    } as never);
    mockedUpdate.mockResolvedValue({
      id: 'rem-1',
      status: 'SNOOZED',
    } as never);

    await ReminderService.updatePersonal('rem-1', 'user-1', {
      status: 'SNOOZED',
      snoozedUntil: new Date('2026-09-10'),
    });

    expect(mockedUpdate).toHaveBeenCalledWith(
      'rem-1',
      expect.objectContaining({ status: 'SNOOZED' }),
    );
  });

  it('cancels a personal reminder', async () => {
    mockedFindById.mockResolvedValue({
      id: 'rem-1',
      userId: 'user-1',
      groupId: null,
    } as never);

    const result = await ReminderService.deletePersonal('rem-1', 'user-1');
    expect(result.success).toBe(true);
    expect(mockedSoftCancel).toHaveBeenCalledWith('rem-1');
  });
});
