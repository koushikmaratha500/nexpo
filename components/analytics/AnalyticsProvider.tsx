'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { parseTrackedElement, trackClick, trackNavSelect, trackPageView, trackTabSelect } from '@/lib/analytics/track';
import type { TrackClickInput, TrackNavInput, TrackTabInput } from '@/lib/analytics/types';

type AnalyticsContextValue = {
  trackClickEvent: (input: TrackClickInput) => void;
  trackTabEvent: (input: TrackTabInput) => void;
  trackNavEvent: (input: TrackNavInput) => void;
};

const AnalyticsCtx = createContext<AnalyticsContextValue | null>(null);

function AnalyticsProviderInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const search = searchParams.toString();
  const searchSuffix = search ? `?${search}` : '';
  const userRole = user?.role ?? null;
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const fullKey = `${pathname}${searchSuffix}`;
    if (lastTrackedPath.current === fullKey) return;
    lastTrackedPath.current = fullKey;
    trackPageView(pathname, searchSuffix, userRole);
  }, [pathname, searchSuffix, userRole]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest('[data-track]');
      if (!(target instanceof HTMLElement)) return;
      const parsed = parseTrackedElement(target);
      if (!parsed) return;
      trackClick(pathname, searchSuffix, parsed, userRole);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, searchSuffix, userRole]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      trackClickEvent: (input) => trackClick(pathname, searchSuffix, input, userRole),
      trackTabEvent: (input) => trackTabSelect(pathname, searchSuffix, input, userRole),
      trackNavEvent: (input) => trackNavSelect(pathname, searchSuffix, input, userRole),
    }),
    [pathname, searchSuffix, userRole],
  );

  return <AnalyticsCtx.Provider value={value}>{children}</AnalyticsCtx.Provider>;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return <AnalyticsProviderInner>{children}</AnalyticsProviderInner>;
}

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsCtx);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

export function useOptionalAnalytics(): AnalyticsContextValue | null {
  return useContext(AnalyticsCtx);
}

export function useTrackTab(section: string) {
  const analytics = useOptionalAnalytics();

  return useCallback(
    (tabId: string, tabLabel: string) => {
      analytics?.trackTabEvent({ tabId, tabLabel, section });
    },
    [analytics, section],
  );
}
