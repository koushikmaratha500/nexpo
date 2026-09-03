import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  API_ROUTES,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  formatCurrency,
  type NotificationPreferences,
  type PersonalReminder,
  type ReminderChannel,
} from '@nexpo/shared';
import { useToast } from '../../../src/hooks/useToast';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { PageShell } from '../../../src/components/layout/PageShell';

const CHANNELS: { id: ReminderChannel; label: string }[] = [
  { id: 'IN_APP', label: 'In-app' },
  { id: 'PUSH', label: 'Push' },
  { id: 'EMAIL', label: 'Email' },
];

export default function RemindersScreen() {
  const { addToast } = useToast();
  const [reminders, setReminders] = useState<PersonalReminder[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [channels, setChannels] = useState<ReminderChannel[]>(['IN_APP', 'PUSH']);
  const [submitting, setSubmitting] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const loadReminders = useCallback(async () => {
    try {
      const data = await apiGet<{ items: PersonalReminder[] }>(API_ROUTES.reminders.list);
      setReminders(data.items || []);
    } catch {
      addToast('Failed to load reminders', 'error');
    }
  }, [addToast]);

  const loadPrefs = useCallback(async () => {
    try {
      const data = await apiGet<NotificationPreferences>(API_ROUTES.notifications.preferences);
      setPrefs(data);
    } catch {
      addToast('Failed to load notification preferences', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    void loadReminders();
    void loadPrefs();
  }, [loadReminders, loadPrefs]);

  const toggleChannel = (channel: ReminderChannel) => {
    setChannels((prev) => {
      if (prev.includes(channel)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== channel);
      }
      return [...prev, channel];
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await apiPost(API_ROUTES.reminders.list, {
        title: title.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        dueDate,
        channels,
        notes: notes.trim() || undefined,
      });
      addToast('Reminder created.', 'success');
      setTitle('');
      setAmount('');
      setNotes('');
      await loadReminders();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create reminder', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnooze = async (id: string) => {
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + 3);
    try {
      await apiPatch(API_ROUTES.reminders.byId(id), {
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
      await apiPatch(API_ROUTES.reminders.byId(id), { status: 'COMPLETED' });
      addToast('Reminder marked complete.', 'success');
      await loadReminders();
    } catch {
      addToast('Failed to update reminder', 'error');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete reminder', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(API_ROUTES.reminders.byId(id));
            addToast('Reminder deleted.', 'success');
            await loadReminders();
          } catch {
            addToast('Failed to delete reminder', 'error');
          }
        },
      },
    ]);
  };

  const savePrefs = async () => {
    if (!prefs) return;
    setSavingPrefs(true);
    try {
      const updated = await apiPatch<NotificationPreferences>(API_ROUTES.notifications.preferences, {
        inAppEnabled: prefs.inAppEnabled,
        emailEnabled: prefs.emailEnabled,
        pushEnabled: prefs.pushEnabled,
        groupActivity: prefs.groupActivity,
      });
      setPrefs(updated);
      addToast('Notification preferences saved.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to save preferences', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const activeReminders = reminders.filter((r) => r.status === 'ACTIVE' || r.status === 'SNOOZED');

  return (
    <PageShell>
      <ScreenHeader
        title="Personal Reminders"
        subtitle="Schedule payment reminders. You'll be notified on the due date."
        action={<Button title="Inbox" variant="secondary" onPress={() => router.push('/(app)/notifications')} />}
      />

      <Card glass className="mb-lg border-primary-fixed/30 bg-primary-fixed/20">
        <Text className="font-body-md leading-5 text-on-surface-variant">
          Personal reminders are only for you. Group reminders are managed inside each group.
        </Text>
      </Card>

      <Card className="mb-lg gap-md">
        <Text className="font-title-md font-bold text-primary">Create reminder</Text>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Rent, credit card..." />
        <Input label="Amount (optional)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Input label="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
        <Text className="text-xs font-bold uppercase text-on-surface-variant">Notify via</Text>
        <View className="flex-row flex-wrap gap-sm">
          {CHANNELS.map((ch) => (
            <Button
              key={ch.id}
              title={ch.label}
              variant={channels.includes(ch.id) ? 'primary' : 'secondary'}
              onPress={() => toggleChannel(ch.id)}
            />
          ))}
        </View>
        <Button title="Add reminder" loading={submitting} onPress={handleCreate} />
      </Card>

      <Card className="mb-lg gap-md">
        <Text className="font-title-md font-bold text-primary">Active reminders</Text>
        {activeReminders.length === 0 ? (
          <Text className="text-on-surface-variant">No active reminders.</Text>
        ) : (
          activeReminders.map((reminder) => (
            <View key={reminder.id} className="gap-sm border-t border-outline-variant/40 pt-md">
              <Text className="font-bold text-on-surface">{reminder.title}</Text>
              <Text className="text-on-surface-variant">
                Due {new Date(reminder.dueDate).toLocaleDateString()}
                {reminder.amount != null ? ` · ${formatCurrency(Number(reminder.amount))}` : ''}
              </Text>
              <View className="flex-row flex-wrap gap-sm">
                <Button title="Snooze" variant="secondary" onPress={() => handleSnooze(reminder.id)} className="min-w-[90px] flex-1" />
                <Button title="Done" variant="secondary" onPress={() => handleComplete(reminder.id)} className="min-w-[90px] flex-1" />
                <Button title="Delete" variant="danger" onPress={() => handleDelete(reminder.id)} className="min-w-[90px] flex-1" />
              </View>
            </View>
          ))
        )}
      </Card>

      {prefs && (
        <Card className="gap-md">
          <Text className="font-title-md font-bold text-primary">Notification preferences</Text>
          {(
            [
              ['inAppEnabled', 'In-app inbox', prefs.adminPolicy.inAppEnabled],
              ['emailEnabled', 'Email reminders', prefs.adminPolicy.emailEnabled],
              ['pushEnabled', 'Push notifications', prefs.adminPolicy.pushEnabled],
              ['groupActivity', 'Group activity', true],
            ] as const
          ).map(([key, label, enabled]) => (
            <View key={key} className="flex-row items-center justify-between py-sm">
              <Text className="flex-1 font-semibold text-on-surface">{label}</Text>
              <Switch
                value={prefs[key]}
                disabled={!enabled}
                onValueChange={(val) => setPrefs({ ...prefs, [key]: val })}
              />
            </View>
          ))}
          <Button title="Save preferences" loading={savingPrefs} onPress={savePrefs} />
        </Card>
      )}
    </PageShell>
  );
}
