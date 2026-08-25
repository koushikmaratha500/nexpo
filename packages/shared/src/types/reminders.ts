export type ReminderChannel = 'IN_APP' | 'PUSH' | 'EMAIL';

export interface PersonalReminder {
  id: string;
  title: string;
  amount?: number | null;
  dueDate: string;
  status: string;
  channels?: string[];
  notes?: string | null;
}

export interface GroupReminderItem {
  id: string;
  title: string;
  amount?: number | null;
  dueDate: string;
  recurrence: 'NONE' | 'WEEKLY' | 'MONTHLY';
  status: 'ACTIVE' | 'COMPLETED' | 'SNOOZED' | 'CANCELLED';
  channels: string[];
  notes?: string | null;
}
