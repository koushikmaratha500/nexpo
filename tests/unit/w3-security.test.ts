import { describe, expect, it, vi, beforeEach } from 'vitest';
import { convertTransactionSchema } from '@/lib/api/dtos/transaction-convert.dto';

describe('convertTransactionSchema', () => {
  it('requires groupId for group target', () => {
    const result = convertTransactionSchema.safeParse({ target: 'group' });
    expect(result.success).toBe(false);
  });

  it('accepts personal conversion', () => {
    const result = convertTransactionSchema.safeParse({ target: 'personal' });
    expect(result.success).toBe(true);
  });
});

describe('reminderDispatchAuth timing-safe compare', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.REMINDER_DISPATCH_SECRET = 'test-secret';
  });

  it('rejects wrong secret', async () => {
    const { assertReminderDispatchAuthorized } = await import('@/lib/api/utils/reminderDispatchAuth');
    const req = new Request('http://localhost/api/internal/reminders/dispatch', {
      headers: { 'x-reminder-dispatch-secret': 'wrong-secret' },
    });
    expect(() => assertReminderDispatchAuthorized(req)).toThrow(/Unauthorized/);
  });

  it('accepts matching secret', async () => {
    const { assertReminderDispatchAuthorized } = await import('@/lib/api/utils/reminderDispatchAuth');
    const req = new Request('http://localhost/api/internal/reminders/dispatch', {
      headers: { 'x-reminder-dispatch-secret': 'test-secret' },
    });
    expect(() => assertReminderDispatchAuthorized(req)).not.toThrow();
  });
});
