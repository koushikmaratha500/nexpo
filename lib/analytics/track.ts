import { pushToDataLayer } from '@/lib/analytics/dataLayer';
import { resolvePageContext } from '@/lib/analytics/pageRegistry';
import {
  ANALYTICS_EVENTS,
  type AnalyticsUserRole,
  type PageContext,
  type TrackClickInput,
  type TrackNavInput,
  type TrackTabInput,
} from '@/lib/analytics/types';

let lastPagePath: string | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function getUserRole(role?: 'ADMIN' | 'CUSTOMER' | null): AnalyticsUserRole {
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'CUSTOMER') return 'CUSTOMER';
  return 'anonymous';
}

function buildPageContext(pathname: string, search = ''): PageContext {
  return resolvePageContext(pathname, search);
}

export function trackPageView(
  pathname: string,
  search = '',
  userRole?: 'ADMIN' | 'CUSTOMER' | null,
): void {
  const context = buildPageContext(pathname, search);
  const referrer_path = lastPagePath && lastPagePath !== pathname ? lastPagePath : undefined;
  lastPagePath = pathname;

  pushToDataLayer({
    event: ANALYTICS_EVENTS.pageView,
    ...context,
    user_role: getUserRole(userRole),
    timestamp: nowIso(),
    referrer_path,
  });
}

export function trackClick(
  pathname: string,
  search: string,
  input: TrackClickInput,
  userRole?: 'ADMIN' | 'CUSTOMER' | null,
): void {
  pushToDataLayer({
    event: ANALYTICS_EVENTS.click,
    ...buildPageContext(pathname, search),
    user_role: getUserRole(userRole),
    timestamp: nowIso(),
    element_type: input.elementType ?? 'button',
    element_id: input.elementId,
    element_text: input.elementText?.slice(0, 120),
    section: input.section,
  });
}

export function trackTabSelect(
  pathname: string,
  search: string,
  input: TrackTabInput,
  userRole?: 'ADMIN' | 'CUSTOMER' | null,
): void {
  pushToDataLayer({
    event: ANALYTICS_EVENTS.tabSelect,
    ...buildPageContext(pathname, search),
    user_role: getUserRole(userRole),
    timestamp: nowIso(),
    tab_id: input.tabId,
    tab_label: input.tabLabel,
    section: input.section,
  });
}

export function trackNavSelect(
  pathname: string,
  search: string,
  input: TrackNavInput,
  userRole?: 'ADMIN' | 'CUSTOMER' | null,
): void {
  pushToDataLayer({
    event: ANALYTICS_EVENTS.navSelect,
    ...buildPageContext(pathname, search),
    user_role: getUserRole(userRole),
    timestamp: nowIso(),
    nav_item: input.navItem,
    nav_path: input.navPath,
    nav_surface: input.navSurface,
  });
}

/** Parse `data-track-*` attributes from a DOM element. */
export function parseTrackedElement(element: HTMLElement): TrackClickInput | null {
  const elementId = element.dataset.track;
  if (!elementId) return null;

  return {
    elementId,
    elementType: (element.dataset.trackType as TrackClickInput['elementType']) ?? 'button',
    elementText: element.dataset.trackLabel ?? element.textContent?.trim() ?? undefined,
    section: element.dataset.trackSection,
  };
}

export function resetAnalyticsPageStateForTests(): void {
  lastPagePath = null;
}
