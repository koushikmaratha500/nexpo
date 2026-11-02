import { useEffect, useRef } from 'react';
import { API_ROUTES, apiGet, apiPost, getApiBaseUrl } from '@nexpo/shared';

/** Optional Redis-backed presence ping for admin online status (ENABLE_PRESENCE on server). */
export function MobilePresenceHeartbeat() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!getApiBaseUrl()) return;
      try {
        const config = await apiGet<{
          presenceEnabled?: boolean;
          presenceHeartbeatIntervalSeconds?: number;
        }>('/api/public/config');
        if (cancelled || !config.presenceEnabled) return;

        const intervalMs = Math.max(
          15_000,
          (config.presenceHeartbeatIntervalSeconds ?? 60) * 1000,
        );

        const ping = () => {
          void apiPost(API_ROUTES.presence, {}).catch(() => undefined);
        };
        ping();
        timerRef.current = setInterval(ping, intervalMs);
      } catch {
        /* ignore */
      }
    }

    void setup();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return null;
}
