'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/hooks/useApi';

type Props = {
  userId: string;
};

/** Polls admin presence API when ENABLE_PRESENCE is on (no UI when disabled). */
export function AdminUserPresenceBadge({ userId }: Props) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const config = await apiGet<{ presenceEnabled?: boolean }>('/api/public/config');
        if (cancelled || !config.presenceEnabled) {
          setEnabled(false);
          return;
        }
        setEnabled(true);

        const poll = async () => {
          try {
            const data = await apiGet<{ enabled: boolean; online: Record<string, boolean> }>(
              `/api/admin/presence?ids=${encodeURIComponent(userId)}`,
            );
            if (!cancelled) {
              setOnline(Boolean(data.online?.[userId]));
            }
          } catch {
            if (!cancelled) setOnline(null);
          }
        };

        await poll();
        interval = setInterval(poll, 30_000);
      } catch {
        setEnabled(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [userId]);

  if (!enabled || online === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-md text-[10px] font-bold ${
        online
          ? 'bg-secondary-container/25 text-on-secondary-container'
          : 'bg-surface-variant/80 text-on-surface-variant'
      }`}
      title={online ? 'Active in the last ~90 seconds' : 'Not active recently'}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-secondary animate-pulse' : 'bg-outline'}`}
        aria-hidden
      />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}
