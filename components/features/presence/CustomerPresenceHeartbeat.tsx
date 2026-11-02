'use client';

import { useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * Sends optional Redis-backed heartbeats when ENABLE_PRESENCE is on (see /api/public/config).
 * No UI; safe to mount in customer shell.
 */
export function CustomerPresenceHeartbeat() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const config = await axios.get<{
          presenceEnabled?: boolean;
          presenceHeartbeatIntervalSeconds?: number;
        }>('/api/public/config');
        if (cancelled || !config.data.presenceEnabled) return;

        const intervalMs = Math.max(
          15_000,
          (config.data.presenceHeartbeatIntervalSeconds ?? 60) * 1000,
        );

        const ping = () => {
          void axios.post('/api/user/presence').catch(() => undefined);
        };
        ping();
        timerRef.current = setInterval(ping, intervalMs);
      } catch {
        /* presence disabled or config unavailable */
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
