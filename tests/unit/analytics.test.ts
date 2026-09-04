import { afterEach, describe, expect, it, vi } from 'vitest';
import { PAGE_REGISTRY, resolvePageContext } from '@/lib/analytics/pageRegistry';
import { parseTrackedElement, resetAnalyticsPageStateForTests, trackPageView } from '@/lib/analytics/track';

describe('analytics page registry', () => {
  it('resolves known routes', () => {
    expect(resolvePageContext('/customer/support').page_name).toBe('customer_support');
    expect(resolvePageContext('/customer/groups/abc').page_name).toBe('customer_group_detail');
    expect(resolvePageContext('/customer', '').page_name).toBe('customer_dashboard');
  });

  it('does not treat support as dashboard', () => {
    const dashboard = PAGE_REGISTRY.find((entry) => entry.name === 'customer_dashboard');
    const support = PAGE_REGISTRY.find((entry) => entry.name === 'customer_support');
    expect(dashboard?.pattern.test('/customer/support')).toBe(false);
    expect(support?.pattern.test('/customer/support')).toBe(true);
  });
});

describe('analytics tracking helpers', () => {
  afterEach(() => {
    resetAnalyticsPageStateForTests();
    vi.unstubAllEnvs();
    delete (globalThis as { dataLayer?: unknown[] }).dataLayer;
  });

  it('parses data-track attributes', () => {
    const element = {
      dataset: {
        track: 'marketing_hero_sign_in',
        trackLabel: 'Sign In',
        trackSection: 'marketing_hero',
        trackType: 'button',
      },
      textContent: 'Sign In',
    } as unknown as HTMLElement;

    expect(parseTrackedElement(element)).toEqual({
      elementId: 'marketing_hero_sign_in',
      elementType: 'button',
      elementText: 'Sign In',
      section: 'marketing_hero',
    });
  });

  it('pushes page views to dataLayer', () => {
    vi.stubGlobal('window', { dataLayer: [] as Record<string, unknown>[] });
    trackPageView('/customer', '', 'CUSTOMER');
    const layer = window.dataLayer;
    expect(layer?.[0]?.event).toBe('ps_page_view');
    expect(layer?.[0]?.page_name).toBe('customer_dashboard');
    expect(layer?.[0]?.user_role).toBe('CUSTOMER');
    vi.unstubAllGlobals();
  });
});
