import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const SYNC_NOTIFICATION_ID = 'sms-sync-job';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type SyncNotificationStage =
  | 'started'
  | 'reading'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'failed'
  | 'empty';

const STAGE_COPY: Record<SyncNotificationStage, { title: string; body: string }> = {
  started: { title: 'Syncing transactions', body: 'Preparing SMS import…' },
  reading: { title: 'Reading bank messages', body: 'Checking inbox since last sync' },
  uploading: { title: 'Uploading transactions…', body: 'Sending messages to PaysaSuchan' },
  processing: { title: 'Processing transactions…', body: 'Parsing bank SMS' },
  complete: { title: 'Import complete', body: 'SMS sync finished' },
  failed: { title: 'Import failed', body: 'Could not sync SMS. Open the app to retry.' },
  empty: { title: 'Up to date', body: 'No new bank messages found' },
};

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sms-sync', {
      name: 'SMS sync',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function showSyncNotification(
  stage: SyncNotificationStage,
  details?: string,
  enabled = true,
): Promise<void> {
  if (!enabled) {
    return;
  }

  const copy = STAGE_COPY[stage];
  await Notifications.scheduleNotificationAsync({
    identifier: SYNC_NOTIFICATION_ID,
    content: {
      title: copy.title,
      body: details ?? copy.body,
      data: { screen: 'sms-sync-status', stage },
    },
    trigger: null,
  });
}

export async function dismissSyncNotification(): Promise<void> {
  await Notifications.dismissNotificationAsync(SYNC_NOTIFICATION_ID);
}
