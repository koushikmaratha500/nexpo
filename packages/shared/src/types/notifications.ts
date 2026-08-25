export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  groupActivity: boolean;
  adminPolicy: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    resendEnabled: boolean;
  };
}
