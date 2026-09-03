/** Customer-facing API paths (prepend `getApiBaseUrl()`). */
export const API_ROUTES = {
  auth: {
    login: '/api/user/auth/login',
    register: '/api/user/auth/register',
    verify: '/api/user/auth/verify',
    logout: '/api/user/logout',
    profile: '/api/user/auth/profile',
    google: '/api/user/auth/google',
    forgotPassword: '/api/user/auth/forgot-password',
    resetPassword: '/api/user/auth/reset-password',
  },
  shares: {
    revoke: (id: string) => `/api/user/shares/${id}`,
  },
  metadata: '/api/user/metadata',
  upload: '/api/upload',
  transactions: {
    list: '/api/user/transactions',
    create: '/api/user/transaction',
    byId: (id: string) => `/api/user/transaction/${id}`,
    share: (id: string) => `/api/user/transaction/${id}/share`,
    shares: (id: string) => `/api/user/transaction/${id}/shares`,
    convert: (id: string) => `/api/user/transaction/${id}/convert`,
    recurring: '/api/user/transactions/recurring',
    importTemplate: '/api/user/transactions/import/template',
    importValidate: '/api/user/transactions/import/validate',
    import: '/api/user/transactions/import',
  },
  groups: {
    list: '/api/user/groups',
    byId: (id: string) => `/api/user/groups/${id}`,
    balances: (id: string) => `/api/user/groups/${id}/balances`,
    transactions: (id: string) => `/api/user/groups/${id}/transactions`,
    createTransaction: (id: string) => `/api/user/groups/${id}/transaction`,
    deleteTransaction: (groupId: string, txnId: string) =>
      `/api/user/groups/${groupId}/transaction/${txnId}`,
    members: (id: string) => `/api/user/groups/${id}/members`,
    promoteMember: (groupId: string, memberId: string) =>
      `/api/user/groups/${groupId}/members/${memberId}/promote`,
    removeMember: (groupId: string, memberId: string) =>
      `/api/user/groups/${groupId}/members/${memberId}`,
    settlementsExport: (id: string) => `/api/user/groups/${id}/settlements/export`,
    reminders: (id: string) => `/api/user/groups/${id}/reminders`,
    reminderById: (groupId: string, reminderId: string) =>
      `/api/user/groups/${groupId}/reminders/${reminderId}`,
  },
  notifications: {
    list: '/api/user/notifications',
    read: (id: string) => `/api/user/notifications/${id}/read`,
    readAll: '/api/user/notifications/read-all',
    preferences: '/api/user/notification-preferences',
    pushRegister: '/api/user/notifications/push/register',
  },
  reminders: {
    list: '/api/user/reminders',
    byId: (id: string) => `/api/user/reminders/${id}`,
    upcoming: '/api/user/reminders/upcoming',
  },
  reports: '/api/user/reports',
  support: '/api/support',
  ai: {
    chat: '/api/ai/chat',
    insights: '/api/ai/insights',
    ocr: '/api/ai/ocr',
  },
} as const;

export function getApiBaseUrl(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL) ||
    '';

  return fromEnv.replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      'API base URL is not configured. Set EXPO_PUBLIC_API_URL (mobile) or NEXT_PUBLIC_APP_URL (web).'
    );
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
