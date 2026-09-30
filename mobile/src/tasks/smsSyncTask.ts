import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { runSmsSync } from '../lib/sms/sync';
import { useAuthStore } from '../store/authStore';

export const SMS_SYNC_TASK = 'sms-sync-background';

TaskManager.defineTask(SMS_SYNC_TASK, async () => {
  const token = useAuthStore.getState().token;
  if (!token) {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  try {
    const result = await runSmsSync(false);
    if (!result.success) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    return (result.accepted ?? 0) > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerSmsSyncTask(): Promise<void> {
  if (Platform.OS === 'ios') {
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_SYNC_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(SMS_SYNC_TASK, {
      minimumInterval: 60 * 60 * 12,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

export async function unregisterSmsSyncTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_SYNC_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(SMS_SYNC_TASK);
  }
}

let lastForegroundSyncAt = 0;
const FOREGROUND_SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;

export function attachSmsForegroundFallback(): () => void {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state !== 'active') {
      return;
    }

    const now = Date.now();
    if (now - lastForegroundSyncAt < FOREGROUND_SYNC_INTERVAL_MS) {
      return;
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      return;
    }

    lastForegroundSyncAt = now;
    void runSmsSync(false);
  });

  return () => subscription.remove();
}
