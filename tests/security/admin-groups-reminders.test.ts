import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { AdminGroupService } from '@/lib/api/services/admin-group.service';
import { AdminReminderService } from '@/lib/api/services/admin-reminder.service';

vi.mock('@/lib/api/middleware/authGuard', () => ({
  authGuard: vi.fn(),
}));

vi.mock('@/lib/api/services/admin-group.service', () => ({
  AdminGroupService: {
    listGroups: vi.fn(),
    getGroupDetail: vi.fn(),
    getGroupBalances: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/admin-reminder.service', () => ({
  AdminReminderService: {
    listReminders: vi.fn(),
    getReminder: vi.fn(),
  },
}));

const mockedAuthGuard = vi.mocked(authGuard);
const mockedListGroups = vi.mocked(AdminGroupService.listGroups);
const mockedListReminders = vi.mocked(AdminReminderService.listReminders);

describe('admin groups route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/groups returns 401 without auth', async () => {
    mockedAuthGuard.mockRejectedValue(new HttpError(401, 'Unauthorized'));
    const { GET } = await import('@/app/api/admin/groups/route');
    const res = await GET(new NextRequest('http://localhost/api/admin/groups'));
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/groups returns groups for admin', async () => {
    mockedAuthGuard.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as never);
    mockedListGroups.mockResolvedValue({
      items: [{ id: 'group-1', name: 'Trip', memberCount: 3 }],
      total: 1,
    } as never);

    const { GET } = await import('@/app/api/admin/groups/route');
    const res = await GET(new NextRequest('http://localhost/api/admin/groups'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
  });
});

describe('admin reminders route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/reminders returns 403 for customer role', async () => {
    mockedAuthGuard.mockRejectedValue(new HttpError(403, 'Insufficient permissions'));
    const { GET } = await import('@/app/api/admin/reminders/route');
    const res = await GET(new NextRequest('http://localhost/api/admin/reminders'));
    expect(res.status).toBe(403);
  });

  it('GET /api/admin/reminders returns reminders for admin', async () => {
    mockedAuthGuard.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' } as never);
    mockedListReminders.mockResolvedValue({
      items: [{ id: 'rem-1', title: 'Rent', scope: 'PERSONAL' }],
      total: 1,
    } as never);

    const { GET } = await import('@/app/api/admin/reminders/route');
    const res = await GET(new NextRequest('http://localhost/api/admin/reminders'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items[0].title).toBe('Rent');
  });
});
