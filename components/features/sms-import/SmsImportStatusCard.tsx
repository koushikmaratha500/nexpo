'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';

type SmsSettings = {
  enabled: boolean;
  last_sync_at: string | null;
  last_batch_summary?: {
    accepted?: number;
    duplicates?: number;
    pending?: number;
  } | null;
};

export function SmsImportStatusCard() {
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await axios.get<{ success: boolean; settings: SmsSettings }>(
          '/api/user/sms/settings',
        );
        setSettings(response.data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load SMS import status');
      }
    })();
  }, []);

  if (error) {
    return null;
  }

  if (!settings) {
    return null;
  }

  const summary = settings.last_batch_summary;

  return (
    <Card className="bg-surface-container-lowest p-5" glass={false}>
      <div>
        <h3 className="font-title-md text-title-md font-bold text-primary">SMS auto-import</h3>
        <p className="font-body-md text-on-surface-variant mt-1">
          Bank SMS import runs on the mobile app (Android auto-sync; iOS manual paste). This page
          shows read-only status.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 font-body-md text-on-surface">
        <p>
          Status:{' '}
          <span className="font-semibold">{settings.enabled ? 'Enabled' : 'Disabled'}</span>
        </p>
        {settings.last_sync_at ? (
          <p className="text-on-surface-variant">
            Last sync: {new Date(settings.last_sync_at).toLocaleString()}
            {summary
              ? ` · ${summary.accepted ?? 0} uploaded, ${summary.duplicates ?? 0} duplicates`
              : ''}
          </p>
        ) : (
          <p className="text-on-surface-variant">No sync recorded yet.</p>
        )}
        <p className="text-on-surface-variant">
          Manage SMS import in the PaysaSuchan mobile app → Settings.
        </p>
      </div>
    </Card>
  );
}
