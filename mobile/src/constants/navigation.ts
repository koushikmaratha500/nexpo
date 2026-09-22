export const APP_TITLE = 'PaysaSuchan';
export const APP_SUBTITLE = 'Personal & Group Ledger';

export type NavIconName =
  | 'dashboard'
  | 'receipt_long'
  | 'groups'
  | 'notifications_active'
  | 'bar_chart'
  | 'smart_toy'
  | 'settings'
  | 'notifications'
  | 'help';

export interface NavItem {
  label: string;
  path: string;
  icon: NavIconName;
  href: `/(app)/(tabs)/${string}` | `/(app)/${string}`;
}

/** Bottom tab bar — compact primary navigation */
export const PRIMARY_TAB_NAV: NavItem[] = [
  { label: 'Home', path: 'index', icon: 'dashboard', href: '/(app)/(tabs)' },
  { label: 'Expenses', path: 'transactions', icon: 'receipt_long', href: '/(app)/(tabs)/transactions' },
  { label: 'AI', path: 'assistant', icon: 'smart_toy', href: '/(app)/(tabs)/assistant' },
  { label: 'Settings', path: 'settings', icon: 'settings', href: '/(app)/(tabs)/settings' },
];

/** Side drawer — all features (includes tab items) */
export const DRAWER_NAV: NavItem[] = [
  { label: 'Home', path: 'index', icon: 'dashboard', href: '/(app)/(tabs)' },
  { label: 'Expenses', path: 'transactions', icon: 'receipt_long', href: '/(app)/(tabs)/transactions' },
  { label: 'Groups', path: 'groups', icon: 'groups', href: '/(app)/(tabs)/groups' },
  { label: 'Reminders', path: 'reminders', icon: 'notifications_active', href: '/(app)/(tabs)/reminders' },
  { label: 'Reports', path: 'reports', icon: 'bar_chart', href: '/(app)/(tabs)/reports' },
  { label: 'AI Assistant', path: 'assistant', icon: 'smart_toy', href: '/(app)/(tabs)/assistant' },
  { label: 'Notifications', path: 'notifications', icon: 'notifications', href: '/(app)/notifications' },
  { label: 'Settings', path: 'settings', icon: 'settings', href: '/(app)/(tabs)/settings' },
  { label: 'Help Center', path: 'support', icon: 'help', href: '/(app)/support' },
];
