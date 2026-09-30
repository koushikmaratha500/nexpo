import { useCallback, useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { API_ROUTES, apiGet, apiPatch } from '@nexpo/shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { requestSmsImportPermissions } from '../../lib/sms/permissions';
import { runSmsSync } from '../../lib/sms/sync';
import { registerSmsSyncTask, unregisterSmsSyncTask } from '../../tasks/smsSyncTask';
import { useToast } from '../../hooks/useToast';

type SmsSettings = {
  enabled: boolean;
  notify_on_sync: boolean;
  last_sync_at: string | null;
  android_sms_granted: boolean;
  notifications_granted: boolean;
  call_granted: boolean;
  location_granted: boolean;
  last_batch_summary?: {
    accepted?: number;
    duplicates?: number;
    pending?: number;
  } | null;
};

function PermissionChip({ label, granted }: { label: string; granted: boolean }) {
  return (
    <View className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1">
      <Text className="font-label-sm text-label-sm text-on-surface-variant">
        {label}: {granted ? 'Granted' : 'Needed'}
      </Text>
    </View>
  );
}

export function SmsImportCard() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<{ success: boolean; settings: SmsSettings }>(
        API_ROUTES.sms.settings,
      );
      setSettings(response.settings);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load SMS settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const toggleEnabled = async (enabled: boolean) => {
    setLoading(true);
    try {
      const response = await apiPatch<{ success: boolean; settings: SmsSettings }>(
        API_ROUTES.sms.settings,
        { enabled },
      );
      setSettings(response.settings);
      if (enabled) {
        await registerSmsSyncTask();
      } else {
        await unregisterSmsSyncTask();
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotify = async (notifyOnSync: boolean) => {
    try {
      const response = await apiPatch<{ success: boolean; settings: SmsSettings }>(
        API_ROUTES.sms.settings,
        { notify_on_sync: notifyOnSync },
      );
      setSettings(response.settings);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const onRequestPermissions = async () => {
    setLoading(true);
    try {
      const state = await requestSmsImportPermissions();
      setSettings((current) =>
        current
          ? {
              ...current,
              android_sms_granted: state.androidSmsGranted,
              notifications_granted: state.notificationsGranted,
              call_granted: state.callGranted,
              location_granted: state.locationGranted,
            }
          : current,
      );
      addToast('Permissions updated', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Permission request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await runSmsSync(true);
      if (!result.success) {
        addToast(result.error ?? 'Sync failed', 'error');
      } else {
        addToast('SMS sync started', 'success');
        await loadSettings();
      }
    } finally {
      setSyncing(false);
    }
  };

  if (!settings) {
    return null;
  }

  return (
    <Card className="mb-lg gap-md">
      <View>
        <Text className="font-title-md font-bold text-primary">SMS auto-import</Text>
        <Text className="mt-1 font-body-md text-on-surface-variant">
          Import bank SMS as transactions automatically (Android). iOS can paste messages manually.
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {Platform.OS === 'android' ? (
          <PermissionChip label="SMS" granted={settings.android_sms_granted} />
        ) : null}
        <PermissionChip label="Notifications" granted={settings.notifications_granted} />
        <PermissionChip label="Call" granted={settings.call_granted} />
        <PermissionChip label="Location" granted={settings.location_granted} />
      </View>

      <View className="flex-row gap-sm">
        <Button
          title={settings.enabled ? 'Enabled' : 'Disabled'}
          variant={settings.enabled ? 'primary' : 'secondary'}
          loading={loading}
          onPress={() => toggleEnabled(!settings.enabled)}
          className="flex-1"
        />
        <Button
          title={settings.notify_on_sync ? 'Notify on' : 'Notify off'}
          variant="secondary"
          onPress={() => toggleNotify(!settings.notify_on_sync)}
          className="flex-1"
        />
      </View>

      <Button title="Grant permissions" variant="secondary" loading={loading} onPress={onRequestPermissions} />

      {Platform.OS === 'android' ? (
        <Button title="Sync now" loading={syncing} onPress={onSyncNow} />
      ) : (
        <Button title="Import SMS manually" variant="secondary" onPress={() => router.push('/(app)/sms-import')} />
      )}

      <Button
        title="View sync status"
        variant="secondary"
        onPress={() => router.push('/(app)/sms-sync-status')}
      />

      {settings.last_sync_at ? (
        <Text className="font-label-sm text-label-sm text-on-surface-variant">
          Last sync: {new Date(settings.last_sync_at).toLocaleString()}
          {settings.last_batch_summary
            ? ` · ${settings.last_batch_summary.accepted ?? 0} uploaded, ${settings.last_batch_summary.duplicates ?? 0} duplicates`
            : ''}
        </Text>
      ) : null}
    </Card>
  );
}
