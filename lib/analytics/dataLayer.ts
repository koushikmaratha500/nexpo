import type { AnalyticsPayload } from '@/lib/analytics/types';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushToDataLayer(payload: AnalyticsPayload | Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload as Record<string, unknown>);

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', payload);
  }
}
