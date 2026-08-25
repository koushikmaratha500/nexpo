'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { UserProfileLink } from '@/components/features/users';

const REMINDER_STATUS_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-secondary-container/20 text-on-secondary-container',
  SNOOZED: 'bg-tertiary-container/20 text-on-tertiary-container',
  CANCELLED: 'bg-surface-container-high text-on-surface-variant',
};

export interface AdminReminderListItem {
  id: string;
  title: string;
  amount?: number | null;
  dueDate: string;
  status: string;
  recurrence?: string;
  channels?: string[];
  scope: 'PERSONAL' | 'GROUP';
  group?: { id: string; name: string } | null;
  owner?: {
    id: string;
    username?: string | null;
    firstName: string;
    lastName?: string;
    email?: string | null;
  } | null;
  createdBy?: {
    id: string;
    username?: string | null;
    firstName: string;
    lastName?: string;
    email?: string | null;
  } | null;
  createdAt?: string;
}

interface AdminReminderListProps {
  reminders: AdminReminderListItem[];
  isLoading?: boolean;
  onView: (reminder: AdminReminderListItem) => void;
}

function userLabel(user?: AdminReminderListItem['createdBy']) {
  if (!user) return '—';
  return (
    <UserProfileLink
      user={user}
      mode="always"
      fallback="—"
    />
  );
}

export function AdminReminderList({ reminders, isLoading = false, onView }: AdminReminderListProps) {
  if (isLoading) {
    return <div className="py-12 text-center text-on-surface-variant">Loading reminders...</div>;
  }

  if (reminders.length === 0) {
    return (
      <Card className="bg-surface-container-lowest py-16 px-6 text-center" glass={false}>
        <p className="font-body-md text-on-surface-variant">No reminders found.</p>
      </Card>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead>Owner / Group</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reminders.map((reminder) => (
            <TableRow key={reminder.id}>
              <TableCell>
                <span className="font-body-md font-bold text-primary">{reminder.title}</span>
                {reminder.amount != null && (
                  <span className="block text-label-md text-on-surface-variant mt-0.5">
                    ₹{Number(reminder.amount).toFixed(2)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-high text-on-surface-variant">
                  {reminder.scope}
                </span>
              </TableCell>
              <TableCell className="text-on-surface-variant">{userLabel(reminder.createdBy)}</TableCell>
              <TableCell className="text-on-surface-variant">
                {reminder.scope === 'GROUP'
                  ? reminder.group?.name || '—'
                  : userLabel(reminder.owner)}
              </TableCell>
              <TableCell className="text-on-surface-variant">
                {new Date(reminder.dueDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    REMINDER_STATUS_CLASSES[reminder.status] || 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {reminder.status}
                </span>
              </TableCell>
              <TableCell align="right">
                <Button variant="secondary" onClick={() => onView(reminder)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
