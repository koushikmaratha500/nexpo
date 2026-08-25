'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { UserProfileLink } from '@/components/features/users';
import type { AdminReminderListItem } from './AdminReminderList';

export interface AdminReminderDetail extends AdminReminderListItem {
  notes?: string | null;
  snoozedUntil?: string | null;
  updatedAt?: string;
}

interface AdminReminderDetailModalProps {
  reminder: AdminReminderDetail | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
}

function UserDetailField({
  label,
  user,
  className = '',
}: {
  label: string;
  user?: AdminReminderDetail['createdBy'];
  className?: string;
}) {
  if (!user) {
    return <DetailField label={label} value="—" className={className} />;
  }

  return (
    <div className={className}>
      <p className="font-label-md font-bold uppercase text-on-surface-variant">{label}</p>
      <div className="font-body-md text-on-surface mt-1 flex flex-col gap-1">
        <UserProfileLink
          user={user}
          mode="always"
          linkClassName="text-primary font-bold hover:underline"
        />
        {user.username ? (
          <UserProfileLink user={{ id: user.id, username: user.username }} mode="always" />
        ) : null}
        {user.email ? <UserProfileLink user={{ id: user.id, email: user.email }} mode="always" /> : null}
      </div>
    </div>
  );
}

export function AdminReminderDetailModal({
  reminder,
  isOpen,
  isLoading = false,
  onClose,
}: AdminReminderDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reminder details"
      subtitle="Read-only admin view"
      maxWidth="max-w-2xl"
    >
      {isLoading || !reminder ? (
        <p className="font-body-md text-on-surface-variant py-8 text-center">Loading reminder details...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField label="Title" value={reminder.title} className="sm:col-span-2" />
          <DetailField label="Scope" value={reminder.scope} />
          <DetailField label="Status" value={reminder.status} />
          <DetailField
            label="Amount"
            value={reminder.amount != null ? `₹${Number(reminder.amount).toFixed(2)}` : '—'}
          />
          <DetailField label="Due date" value={new Date(reminder.dueDate).toLocaleString()} />
          <DetailField label="Recurrence" value={reminder.recurrence || 'NONE'} />
          <DetailField label="Channels" value={(reminder.channels || []).join(', ') || '—'} className="sm:col-span-2" />
          <UserDetailField label="Created by" user={reminder.createdBy} className="sm:col-span-2" />
          {reminder.scope === 'GROUP' ? (
            <DetailField label="Group" value={reminder.group?.name || '—'} className="sm:col-span-2" />
          ) : (
            <UserDetailField label="Owner" user={reminder.owner} className="sm:col-span-2" />
          )}
          <DetailField
            label="Snoozed until"
            value={reminder.snoozedUntil ? new Date(reminder.snoozedUntil).toLocaleString() : '—'}
          />
          <DetailField
            label="Created at"
            value={reminder.createdAt ? new Date(reminder.createdAt).toLocaleString() : '—'}
          />
          <DetailField
            label="Updated at"
            value={reminder.updatedAt ? new Date(reminder.updatedAt).toLocaleString() : '—'}
          />
          <DetailField label="Notes" value={reminder.notes || '—'} className="sm:col-span-2" />
        </div>
      )}
    </Modal>
  );
}

function DetailField({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-label-md font-bold uppercase text-on-surface-variant">{label}</p>
      <p className="font-body-md text-on-surface mt-1 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
