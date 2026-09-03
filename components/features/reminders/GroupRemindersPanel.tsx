'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

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

interface GroupRemindersPanelProps {
  groupId: string;
  myRole: 'ADMIN' | 'MEMBER';
}

export function GroupRemindersPanel({ groupId, myRole }: GroupRemindersPanelProps) {
  const { addToast } = useToast();
  const [reminders, setReminders] = useState<GroupReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<{ items: GroupReminderItem[] }>(
        `/api/user/groups/${groupId}/reminders`,
      );
      setReminders(response.data.items || []);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load group reminders';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, groupId]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`/api/user/groups/${groupId}/reminders`, {
        title: title.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        dueDate,
        channel: 'IN_APP',
        notes: notes.trim() || undefined,
      });
      addToast('Group reminder created.', 'success');
      setTitle('');
      setAmount('');
      setNotes('');
      await loadReminders();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to create group reminder';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reminderId: string) => {
    try {
      await axios.delete(`/api/user/groups/${groupId}/reminders/${reminderId}`);
      addToast('Group reminder removed.', 'success');
      await loadReminders();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to delete group reminder';
      addToast(msg, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {myRole === 'ADMIN' && (
        <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
          <div>
            <h3 className="font-title-md text-title-md font-bold text-primary">Add group reminder</h3>
            <p className="font-body-md text-on-surface-variant mt-1">
              All members receive an in-app notification when a group reminder is created.
            </p>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="font-label-md font-bold text-on-surface-variant">Title</span>
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-md font-bold text-on-surface-variant">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-md font-bold text-on-surface-variant">Due date</span>
              <input
                type="date"
                className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="font-label-md font-bold text-on-surface-variant">Notes</span>
              <textarea
                className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 min-h-[80px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Create reminder'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <p className="text-on-surface-variant">Loading reminders...</p>
      ) : reminders.length === 0 ? (
        <Card className="bg-surface-container-lowest p-8 text-center" glass={false}>
          <p className="text-on-surface-variant">No group reminders yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="bg-surface-container-lowest p-4 flex flex-col gap-2" glass={false}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-title-md font-bold text-primary">{reminder.title}</h4>
                  <p className="font-body-md text-on-surface-variant">
                    Due {new Date(reminder.dueDate).toLocaleDateString()}
                    {reminder.amount != null ? ` · ₹${Number(reminder.amount).toFixed(2)}` : ''}
                  </p>
                </div>
                {myRole === 'ADMIN' && (
                  <Button variant="secondary" onClick={() => handleDelete(reminder.id)}>
                    Delete
                  </Button>
                )}
              </div>
              {reminder.notes && (
                <p className="font-body-md text-on-surface-variant">{reminder.notes}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
