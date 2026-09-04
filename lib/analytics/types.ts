export type AnalyticsUserRole = 'CUSTOMER' | 'ADMIN' | 'anonymous';

export type AnalyticsElementType =
  | 'button'
  | 'link'
  | 'tab'
  | 'nav'
  | 'fab'
  | 'menu'
  | 'modal'
  | 'form';

/** GTM dataLayer event names — keep in sync with TRACKING_PLAN.md */
export const ANALYTICS_EVENTS = {
  pageView: 'ps_page_view',
  click: 'ps_click',
  tabSelect: 'ps_tab_select',
  navSelect: 'ps_nav_select',
  formSubmit: 'ps_form_submit',
  auth: 'ps_auth',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface PageContext {
  page_path: string;
  page_title: string;
  page_name: string;
  page_section: string;
  page_query?: string;
}

export interface AnalyticsBasePayload extends PageContext {
  event: AnalyticsEventName;
  user_role: AnalyticsUserRole;
  timestamp: string;
}

export interface PageViewPayload extends AnalyticsBasePayload {
  event: typeof ANALYTICS_EVENTS.pageView;
  referrer_path?: string;
}

export interface ClickPayload extends AnalyticsBasePayload {
  event: typeof ANALYTICS_EVENTS.click;
  element_type: AnalyticsElementType;
  element_id: string;
  element_text?: string;
  section?: string;
}

export interface TabSelectPayload extends AnalyticsBasePayload {
  event: typeof ANALYTICS_EVENTS.tabSelect;
  tab_id: string;
  tab_label: string;
  section: string;
}

export interface NavSelectPayload extends AnalyticsBasePayload {
  event: typeof ANALYTICS_EVENTS.navSelect;
  nav_item: string;
  nav_path: string;
  nav_surface: 'sidebar' | 'bottom_nav' | 'header' | 'footer';
}

export type AnalyticsPayload =
  | PageViewPayload
  | ClickPayload
  | TabSelectPayload
  | NavSelectPayload;

export interface TrackClickInput {
  elementId: string;
  elementType?: AnalyticsElementType;
  elementText?: string;
  section?: string;
}

export interface TrackTabInput {
  tabId: string;
  tabLabel: string;
  section: string;
}

export interface TrackNavInput {
  navItem: string;
  navPath: string;
  navSurface: NavSelectPayload['nav_surface'];
}
