import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { API_ROUTES, apiGet } from '@nexpo/shared';
import { PageShell } from '../../src/components/layout/PageShell';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Card } from '../../src/components/ui/Card';

type SyncStatus = {
  last_sync_at: string | null;
  last_batch_id: string | null;
  last_batch_summary: {
    accepted?: number;
    duplicates?: number;
    pending?: number;
    sync_batch_id?: string;
  } | null;
};

export default function SmsSyncStatusScreen() {
  const [status, setStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await apiGet<{ success: boolean } & SyncStatus>(API_ROUTES.sms.syncStatus);
      setStatus(response);
    })();
  }, []);

  return (
    <PageShell>
      <ScreenHeader title="SMS sync status" subtitle="Latest background import job" />

      <Card className="gap-sm">
        <Text className="font-body-md text-on-surface">
          Last sync: {status?.last_sync_at ? new Date(status.last_sync_at).toLocaleString() : 'Never'}
        </Text>
        <Text className="font-body-md text-on-surface">
          Batch ID: {status?.last_batch_id ?? '—'}
        </Text>
        <Text className="font-body-md text-on-surface">
          Uploaded: {status?.last_batch_summary?.accepted ?? 0}
        </Text>
        <Text className="font-body-md text-on-surface">
          Duplicates skipped: {status?.last_batch_summary?.duplicates ?? 0}
        </Text>
        <Text className="font-body-md text-on-surface">
          Pending parse: {status?.last_batch_summary?.pending ?? 0}
        </Text>
      </Card>
    </PageShell>
  );
}
