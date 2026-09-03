'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface PersonalReminder {
  id: string;
  title: string;
  amount?: number | null;
  dueDate: string;
  status: string;
  channels?: string[];
  notes?: string | null;
}

type ReminderChannel = 'IN_APP' | 'PUSH' | 'EMAIL';

const CHANNEL_OPTIONS: { id: ReminderChannel; label: string; description: string }[] = [
  { id: 'IN_APP', label: 'In-app', description: 'Bell icon and notifications page' },
  { id: 'PUSH', label: 'Mobile push', description: 'Requires push opt-in in preferences' },
  { id: 'EMAIL', label: 'Email', description: 'Sent on the due date if enabled' },
];

export function PersonalRemindersPanel() {
  const { addToast } = useToast();
  const [reminders, setReminders] = useState<PersonalReminder[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [channels, setChannels] = useState<ReminderChannel[]>(['IN_APP', 'PUSH']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReminders = useCallback(async () => {
    try {
      const response = await axios.get<{ items: PersonalReminder[] }>('/api/user/reminders');
      setReminders(response.data.items || []);
    } catch {
      addToast('Failed to load reminders', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const toggleChannel = (channel: ReminderChannel) => {
    setChannels((prev) => {
      if (prev.includes(channel)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== channel);
      }
      return [...prev, channel];
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/user/reminders', {
        title: title.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        dueDate,
        channels,
        notes: notes.trim() || undefined,
      });
      addToast('Reminder created. You will be notified on the due date.', 'success');
      setTitle('');
      setAmount('');
      setNotes('');
      await loadReminders();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to create reminder';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnooze = async (id: string) => {
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + 3);
    try {
      await axios.patch(`/api/user/reminders/${id}`, {
        status: 'SNOOZED',
        snoozedUntil: snoozedUntil.toISOString().slice(0, 10),
      });
      addToast('Reminder snoozed for 3 days.', 'success');
      await loadReminders();
    } catch {
      addToast('Failed to snooze reminder', 'error');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await axios.patch(`/api/user/reminders/${id}`, { status: 'COMPLETED' });
      addToast('Reminder marked complete.', 'success');
      await loadReminders();
    } catch {
      addToast('Failed to update reminder', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/user/reminders/${id}`);
      addToast('Reminder deleted.', 'success');
      await loadReminders();
    } catch {
      addToast('Failed to delete reminder', 'error');
    }
  };

  const activeReminders = reminders.filter((reminder) => reminder.status === 'ACTIVE' || reminder.status === 'SNOOZED');

  return (
    <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
      <div>
        <h3 className="font-title-md text-title-md font-bold text-primary">Your reminders</h3>
        <p className="font-body-md text-on-surface-variant mt-1">
          Personal payment reminders notify you on the due date via the channels you choose below.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-4 rounded-xl border border-outline-variant/20 p-4">
        <h4 className="font-title-sm font-bold text-primary">Create reminder</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="font-label-md font-bold text-on-surface-variant">Title</span>
            <input
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rent, credit card bill..."
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md font-bold text-on-surface-variant">Amount (optional)</span>
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
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-label-md font-bold text-on-surface-variant">Notify me via</span>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((option) => {
              const selected = channels.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleChannel(option.id)}
                  className={`px-3 py-2 rounded-xl text-left border transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 bg-surface text-on-surface-variant'
                  }`}
                >
                  <span className="font-label-md font-bold block">{option.label}</span>
                  <span className="font-label-md opacity-80">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add reminder'}
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        <h4 className="font-title-sm font-bold text-primary">Active reminders</h4>
        {activeReminders.map((reminder) => (
          <div
            key={reminder.id}
            className="rounded-xl border border-outline-variant/20 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div>
              <p className="font-body-md font-bold text-on-surface">{reminder.title}</p>
              <p className="font-label-md text-on-surface-variant">
                Due {new Date(reminder.dueDate).toLocaleDateString()}
                {reminder.amount != null ? ` · ₹${Number(reminder.amount).toFixed(2)}` : ''}
                {reminder.status === 'SNOOZED' ? ' · Snoozed' : ''}
              </p>
              {reminder.channels && reminder.channels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {reminder.channels.map((channel) => (
                    <span
                      key={channel}
                      className="px-2 py-0.5 rounded-full bg-surface-container-low text-[10px] font-bold uppercase text-on-surface-variant"
                    >
                      {channel.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => handleSnooze(reminder.id)}>
                Snooze
              </Button>
              <Button variant="secondary" onClick={() => handleComplete(reminder.id)}>
                Done
              </Button>
              <Button variant="secondary" onClick={() => handleDelete(reminder.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
        {activeReminders.length === 0 && (
          <p className="font-body-md text-on-surface-variant">No active reminders. Create one above.</p>
        )}
      </div>

      <p className="font-label-md text-on-surface-variant">
        Manage delivery channels in{' '}
        <Link href="/customer/settings" className="text-primary font-bold hover:underline">
          Settings → Notification preferences
        </Link>
        .
      </p>
    </Card>
  );
}
