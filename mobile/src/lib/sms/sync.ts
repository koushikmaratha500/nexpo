import { API_ROUTES, apiGet, apiPatch, apiPost } from '@nexpo/shared';
import { getDeviceId } from './deviceId';
import { readBankSmsSince } from './readInbox';
import { showSyncNotification } from './syncNotifications';
import { useAuthStore } from '../../store/authStore';

type SmsSettings = {
  enabled: boolean;
  notify_on_sync: boolean;
  last_sync_at: string | null;
};

type SyncResponse = {
  success: boolean;
  accepted?: number;
  duplicates?: number;
  pending?: number;
  sync_batch_id?: string | null;
  error?: string;
};

export async function runSmsSync(manual = false): Promise<SyncResponse> {
  const user = useAuthStore.getState().user;
  if (!user?.email) {
    return { success: false, error: 'Not signed in' };
  }

  const settingsResponse = await apiGet<{ success: boolean; settings: SmsSettings }>(
    API_ROUTES.sms.settings,
  );
  const settings = settingsResponse.settings;
  if (!settings.enabled) {
    return { success: false, error: 'SMS import is disabled' };
  }

  const notify = settings.notify_on_sync;
  await showSyncNotification('started', undefined, notify);

  try {
    await showSyncNotification('reading', undefined, notify);
    const since = settings.last_sync_at ? new Date(settings.last_sync_at) : null;
    const inbox = await readBankSmsSince(since);

    if (inbox.length === 0) {
      await showSyncNotification('empty', undefined, notify);
      return { success: true, accepted: 0, duplicates: 0, pending: 0, sync_batch_id: null };
    }

    await showSyncNotification('uploading', `Uploading ${inbox.length} messages`, notify);

    const deviceId = await getDeviceId();
    const messages = inbox.map((sms) => ({
      external_sms_id: sms.externalSmsId,
      sender: sms.sender,
      body: sms.body,
      received_at: sms.receivedAt.toISOString(),
    }));

    await showSyncNotification('processing', undefined, notify);

    const result = await apiPost<SyncResponse>(API_ROUTES.sms.sync, {
      device_id: deviceId,
      messages,
    });

    if (!result.success) {
      await showSyncNotification('failed', result.error, notify);
      return result;
    }

    const summary = `${result.accepted ?? 0} uploaded, ${result.duplicates ?? 0} duplicates skipped`;
    await showSyncNotification('complete', summary, notify);

    if (manual) {
      await apiPatch(API_ROUTES.sms.settings, {}).catch(() => undefined);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    await showSyncNotification('failed', message, notify);
    return { success: false, error: message };
  }
}
