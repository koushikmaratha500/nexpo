import { Platform } from 'react-native';

export type InboxSms = {
  externalSmsId?: string;
  sender: string;
  body: string;
  receivedAt: Date;
};

type SmsFilter = {
  box: string;
  minDate: number;
  maxCount: number;
};

function parseSmsRow(row: Record<string, unknown>): InboxSms | null {
  const body = typeof row.body === 'string' ? row.body.trim() : '';
  const address = typeof row.address === 'string' ? row.address.trim() : '';
  if (!body || !address) {
    return null;
  }

  const dateValue = typeof row.date === 'number' ? row.date : Number(row.date);
  const receivedAt = Number.isFinite(dateValue) ? new Date(dateValue) : new Date();

  return {
    externalSmsId: typeof row._id === 'string' || typeof row._id === 'number' ? String(row._id) : undefined,
    sender: address,
    body,
    receivedAt,
  };
}

export async function readBankSmsSince(since: Date | null): Promise<InboxSms[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    const SmsAndroid = require('react-native-get-sms-android') as {
      list: (
        filter: string,
        fail: (error: string) => void,
        success: (count: number, smsList: string) => void,
      ) => void;
    };

    const filter: SmsFilter = {
      box: 'inbox',
      minDate: since ? since.getTime() : 0,
      maxCount: 200,
    };

    const rawList = await new Promise<string>((resolve, reject) => {
      SmsAndroid.list(JSON.stringify(filter), reject, (_count, smsList) => resolve(smsList));
    });

    const rows = JSON.parse(rawList) as Record<string, unknown>[];
    return rows.map(parseSmsRow).filter((row): row is InboxSms => row !== null);
  } catch (error) {
    console.warn('[SMS] Inbox read unavailable (EAS dev build required):', error);
    return [];
  }
}
