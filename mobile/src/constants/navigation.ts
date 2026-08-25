export const CUSTOMER_NAV = [
  { name: 'Home', path: 'index', icon: 'dashboard' as const, label: 'Dashboard' },
  { name: 'Transactions', path: 'transactions', icon: 'receipt_long' as const, label: 'Txns' },
  { name: 'Groups', path: 'groups', icon: 'groups' as const, label: 'Groups' },
  { name: 'Reminders', path: 'reminders', icon: 'notifications_active' as const, label: 'Remind' },
  { name: 'Reports', path: 'reports', icon: 'bar_chart' as const, label: 'Reports' },
  { name: 'Assistant', path: 'assistant', icon: 'smart_toy' as const, label: 'AI' },
  { name: 'Settings', path: 'settings', icon: 'settings' as const, label: 'Settings' },
] as const;

export const APP_TITLE = 'Expensify Pro';
export const APP_SUBTITLE = 'Corporate Tier';
