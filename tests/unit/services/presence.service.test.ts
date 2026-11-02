import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PresenceService } from '@/lib/api/services/presence.service';

vi.mock('@/lib/api/utils/redisClient', () => ({
  kvGetJson: vi.fn(),
  kvSetJson: vi.fn(),
}));

import { kvGetJson, kvSetJson } from '@/lib/api/utils/redisClient';

describe('PresenceService', () => {
  const prevEnv = process.env.ENABLE_PRESENCE;

  beforeEach(() => {
    vi.mocked(kvGetJson).mockReset();
    vi.mocked(kvSetJson).mockReset();
  });

  afterEach(() => {
    if (prevEnv === undefined) delete process.env.ENABLE_PRESENCE;
    else process.env.ENABLE_PRESENCE = prevEnv;
  });

  it('no-ops heartbeat when feature is disabled', async () => {
    process.env.ENABLE_PRESENCE = 'false';
    const result = await PresenceService.heartbeat('user-1');
    expect(result).toEqual({ ok: false, enabled: false });
    expect(kvSetJson).not.toHaveBeenCalled();
  });

  it('writes Redis TTL key when enabled', async () => {
    process.env.ENABLE_PRESENCE = 'true';
    vi.mocked(kvSetJson).mockResolvedValue(undefined);
    const result = await PresenceService.heartbeat('user-1');
    expect(result.ok).toBe(true);
    expect(kvSetJson).toHaveBeenCalledWith(
      expect.stringContaining('user-1'),
      expect.objectContaining({ lastSeenAt: expect.any(String) }),
      expect.any(Number),
    );
  });

  it('returns online map from Redis keys', async () => {
    process.env.ENABLE_PRESENCE = 'true';
    vi.mocked(kvGetJson).mockImplementation(async (key: string) =>
      key.includes('a') ? { lastSeenAt: new Date().toISOString() } : null,
    );
    const online = await PresenceService.getOnlineStatusByUserIds(['a', 'b']);
    expect(online).toEqual({ a: true, b: false });
  });
});
