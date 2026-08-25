import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PushService } from '@/lib/api/services/push.service';

describe('PushService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.ONESIGNAL_APP_ID = 'app-123';
    process.env.ONESIGNAL_REST_API_KEY = 'key-123';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.ONESIGNAL_APP_ID;
    delete process.env.ONESIGNAL_REST_API_KEY;
  });

  it('skips send when OneSignal is not configured', async () => {
    delete process.env.ONESIGNAL_APP_ID;
    const result = await PushService.send(['user-1'], { title: 'Hi', body: 'There' });
    expect(result.skipped).toBe(true);
    expect(result.sent).toBe(0);
  });

  it('posts to OneSignal when configured', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    }) as never;

    const result = await PushService.send(['user-1', 'user-2'], {
      title: 'Reminder due',
      body: 'Rent is due today',
    });

    expect(result.sent).toBe(2);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.onesignal.com/notifications',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws when OneSignal returns an error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      text: async () => 'invalid payload',
    }) as never;

    await expect(
      PushService.send(['user-1'], { title: 'Reminder due', body: 'Rent is due today' }),
    ).rejects.toThrow('OneSignal request failed');
  });
});
