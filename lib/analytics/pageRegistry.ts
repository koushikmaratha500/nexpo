export interface PageDefinition {
  pattern: RegExp;
  name: string;
  title: string;
  section: string;
}

/** Stable page names for reporting — order matters (first match wins). */
export const PAGE_REGISTRY: PageDefinition[] = [
  { pattern: /^\/$/, name: 'marketing_home', title: 'Home', section: 'marketing' },
  { pattern: /^\/auth\/login$/, name: 'auth_login', title: 'Sign In', section: 'auth' },
  { pattern: /^\/auth\/register$/, name: 'auth_register', title: 'Register', section: 'auth' },
  { pattern: /^\/auth\/forgot-password$/, name: 'auth_forgot_password', title: 'Forgot Password', section: 'auth' },
  { pattern: /^\/auth\/reset-password$/, name: 'auth_reset_password', title: 'Reset Password', section: 'auth' },
  { pattern: /^\/auth\/activate$/, name: 'auth_activate', title: 'Activate Account', section: 'auth' },
  { pattern: /^\/auth\/forced-reset$/, name: 'auth_forced_reset', title: 'Forced Password Reset', section: 'auth' },
  { pattern: /^\/auth\/blocked$/, name: 'auth_blocked', title: 'Account Blocked', section: 'auth' },
  { pattern: /^\/auth\/callback\/complete$/, name: 'auth_google_complete', title: 'Google Sign-In Complete', section: 'auth' },
  { pattern: /^\/r\/[^/]+$/, name: 'public_receipt', title: 'Public Receipt', section: 'public' },
  { pattern: /^\/customer\/transactions$/, name: 'customer_transactions', title: 'Transactions', section: 'customer' },
  { pattern: /^\/customer\/groups\/[^/]+$/, name: 'customer_group_detail', title: 'Group Detail', section: 'customer' },
  { pattern: /^\/customer\/groups$/, name: 'customer_groups', title: 'Groups', section: 'customer' },
  { pattern: /^\/customer\/reminders$/, name: 'customer_reminders', title: 'Reminders', section: 'customer' },
  { pattern: /^\/customer\/notifications$/, name: 'customer_notifications', title: 'Notifications', section: 'customer' },
  { pattern: /^\/customer\/reports$/, name: 'customer_reports', title: 'Reports', section: 'customer' },
  { pattern: /^\/customer\/assistant$/, name: 'customer_assistant', title: 'AI Assistant', section: 'customer' },
  { pattern: /^\/customer\/settings$/, name: 'customer_settings', title: 'Settings', section: 'customer' },
  { pattern: /^\/customer\/support$/, name: 'customer_support', title: 'Help Center', section: 'customer' },
  { pattern: /^\/customer$/, name: 'customer_dashboard', title: 'Dashboard', section: 'customer' },
  { pattern: /^\/admin\/login$/, name: 'admin_login', title: 'Admin Sign In', section: 'admin' },
  { pattern: /^\/admin\/forgot-password$/, name: 'admin_forgot_password', title: 'Admin Forgot Password', section: 'admin' },
  { pattern: /^\/admin\/reset-password$/, name: 'admin_reset_password', title: 'Admin Reset Password', section: 'admin' },
  { pattern: /^\/admin\/users\/[^/]+$/, name: 'admin_user_detail', title: 'Customer Detail', section: 'admin' },
  { pattern: /^\/admin\/users$/, name: 'admin_users', title: 'Customers', section: 'admin' },
  { pattern: /^\/admin\/groups\/[^/]+$/, name: 'admin_group_detail', title: 'Group Detail', section: 'admin' },
  { pattern: /^\/admin\/groups$/, name: 'admin_groups', title: 'Groups', section: 'admin' },
  { pattern: /^\/admin\/reminders$/, name: 'admin_reminders', title: 'Reminders', section: 'admin' },
  { pattern: /^\/admin\/admins$/, name: 'admin_admins', title: 'Administrators', section: 'admin' },
  { pattern: /^\/admin\/categories$/, name: 'admin_categories', title: 'Categories', section: 'admin' },
  { pattern: /^\/admin\/reports$/, name: 'admin_reports', title: 'Reports', section: 'admin' },
  { pattern: /^\/admin\/support\/[^/]+$/, name: 'admin_support_detail', title: 'Support Ticket', section: 'admin' },
  { pattern: /^\/admin\/support$/, name: 'admin_support', title: 'Support', section: 'admin' },
  { pattern: /^\/admin\/settings$/, name: 'admin_settings', title: 'Settings', section: 'admin' },
  { pattern: /^\/admin$/, name: 'admin_dashboard', title: 'Admin Dashboard', section: 'admin' },
];

export function resolvePageContext(pathname: string, search = ''): {
  page_path: string;
  page_title: string;
  page_name: string;
  page_section: string;
  page_query?: string;
} {
  const match = PAGE_REGISTRY.find((entry) => entry.pattern.test(pathname));
  const page_query = search ? search.replace(/^\?/, '') : undefined;

  if (match) {
    return {
      page_path: pathname,
      page_title: match.title,
      page_name: match.name,
      page_section: match.section,
      page_query,
    };
  }

  return {
    page_path: pathname,
    page_title: 'Unknown Page',
    page_name: 'unknown',
    page_section: 'other',
    page_query,
  };
}
