'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { promptOneSignalOptIn } from './OneSignalProvider';

interface NotificationPreferences {
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

export function NotificationPreferencesCard() {
  const { addToast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushPermissionGranted, setPushPermissionGranted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await axios.get<NotificationPreferences>('/api/user/notification-preferences');
        setPrefs(response.data);
      } catch {
        addToast('Failed to load notification preferences', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    load();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermissionGranted(Notification.permission === 'granted');
    }
  }, [addToast]);

  const handleSave = async () => {
    if (!prefs) return;
    setIsSaving(true);
    try {
      const response = await axios.patch('/api/user/notification-preferences', {
        inAppEnabled: prefs.inAppEnabled,
        emailEnabled: prefs.emailEnabled,
        pushEnabled: prefs.pushEnabled,
        groupActivity: prefs.groupActivity,
      });
      setPrefs(response.data);
      addToast('Notification preferences saved.', 'success');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to save notification preferences';
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async () => {
    const result = await promptOneSignalOptIn();
    setPushPermissionGranted(result.granted);
    if (result.granted) {
      addToast('Push notifications enabled.', 'success');
      setPrefs((prev) => (prev ? { ...prev, pushEnabled: true } : prev));
    } else {
      addToast('Push permission was not granted.', 'warning');
    }
  };

  if (isLoading || !prefs) {
    return (
      <Card className="bg-surface-container-lowest p-6" glass={false}>
        <p className="text-on-surface-variant">Loading notification settings...</p>
      </Card>
    );
  }

  const toggle = (key: keyof Pick<NotificationPreferences, 'inAppEnabled' | 'emailEnabled' | 'pushEnabled' | 'groupActivity'>) => {
    setPrefs((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  return (
    <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
      <div>
        <h3 className="font-title-md text-title-md font-bold text-primary">Notifications</h3>
        <p className="font-body-md text-on-surface-variant mt-1">
          Control how you receive reminders and group activity. Admin policy may disable channels globally.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="font-body-md font-bold text-on-surface block">In-app inbox</span>
            <span className="font-label-md text-on-surface-variant">
              {prefs.adminPolicy.inAppEnabled ? 'Show reminders in your notification inbox.' : 'Disabled by admin.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={prefs.inAppEnabled}
            disabled={!prefs.adminPolicy.inAppEnabled}
            onChange={() => toggle('inAppEnabled')}
          />
        </label>

        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="font-body-md font-bold text-on-surface block">Email reminders</span>
            <span className="font-label-md text-on-surface-variant">
              {prefs.adminPolicy.emailEnabled
                ? 'Receive reminder emails when enabled.'
                : 'Disabled by admin or Resend is off.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={prefs.emailEnabled}
            disabled={!prefs.adminPolicy.emailEnabled}
            onChange={() => toggle('emailEnabled')}
          />
        </label>

        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="font-body-md font-bold text-on-surface block">Push notifications</span>
            <span className="font-label-md text-on-surface-variant">
              {prefs.adminPolicy.pushEnabled
                ? 'Browser push via OneSignal when subscribed.'
                : 'Disabled by admin.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={prefs.pushEnabled}
            disabled={!prefs.adminPolicy.pushEnabled || !pushPermissionGranted}
            onChange={() => toggle('pushEnabled')}
          />
        </label>

        {!pushPermissionGranted && prefs.adminPolicy.pushEnabled && (
          <Button type="button" variant="secondary" onClick={handleEnablePush}>
            Enable browser push
          </Button>
        )}

        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="font-body-md font-bold text-on-surface block">Group activity</span>
            <span className="font-label-md text-on-surface-variant">
              Notify me when admins add group reminders.
            </span>
          </span>
          <input type="checkbox" checked={prefs.groupActivity} onChange={() => toggle('groupActivity')} />
        </label>
      </div>

      <div className="flex justify-end border-t border-outline-variant/30 pt-4">
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save notification settings'}
        </Button>
      </div>
    </Card>
  );
}
