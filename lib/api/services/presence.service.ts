import { kvGetJson, kvSetJson } from '../utils/redisClient';
import {
  isPresenceEnabled,
  presenceKeyForUser,
  PRESENCE_HEARTBEAT_INTERVAL_SECONDS,
  PRESENCE_TTL_SECONDS,
} from '../utils/presence-config';

interface PresencePayload {
  lastSeenAt: string;
}

export class PresenceService {
  static featureConfig() {
    return {
      enabled: isPresenceEnabled(),
      heartbeatIntervalSeconds: PRESENCE_HEARTBEAT_INTERVAL_SECONDS,
      ttlSeconds: PRESENCE_TTL_SECONDS,
    };
  }

  static async heartbeat(userId: string): Promise<{ ok: boolean; enabled: boolean }> {
    if (!isPresenceEnabled()) {
      return { ok: false, enabled: false };
    }

    const payload: PresencePayload = { lastSeenAt: new Date().toISOString() };
    try {
      await kvSetJson(presenceKeyForUser(userId), payload, PRESENCE_TTL_SECONDS);
      return { ok: true, enabled: true };
    } catch (error) {
      console.warn('[presence] heartbeat failed for user', userId, error);
      return { ok: false, enabled: true };
    }
  }

  static async isUserOnline(userId: string): Promise<boolean> {
    if (!isPresenceEnabled()) return false;
    const payload = await kvGetJson<PresencePayload>(presenceKeyForUser(userId));
    return payload != null;
  }

  static async getOnlineStatusByUserIds(
    userIds: string[],
  ): Promise<Record<string, boolean>> {
    if (!isPresenceEnabled() || userIds.length === 0) {
      return Object.fromEntries(userIds.map((id) => [id, false]));
    }

    const entries = await Promise.all(
      userIds.map(async (id) => {
        const payload = await kvGetJson<PresencePayload>(presenceKeyForUser(id));
        return [id, payload != null] as const;
      }),
    );
    return Object.fromEntries(entries);
  }
}
