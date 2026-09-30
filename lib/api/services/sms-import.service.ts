import { randomUUID } from 'crypto';
import { computeSmsMessageHash } from '@/lib/auth/smsMessageHash';
import type {
  SmsManualImportRequest,
  SmsMessageInput,
  SmsSettingsUpdate,
  SmsSyncRequest,
} from '../dtos/sms-import.dto';
import { SmsImportRepository } from '../repositories/sms-import.repository';

const DEFAULT_MAX_BATCH = 50;

function getMaxBatchSize(): number {
  const raw = process.env.SMS_SYNC_MAX_BATCH?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_MAX_BATCH;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_BATCH;
}

function serializeSettings(settings: Awaited<ReturnType<typeof SmsImportRepository.getOrCreateSettings>>) {
  return {
    enabled: settings.enabled,
    notify_on_sync: settings.notifyOnSync,
    last_sync_at: settings.lastSyncAt?.toISOString() ?? null,
    last_sync_device_id: settings.lastSyncDeviceId,
    last_batch_id: settings.lastBatchId,
    last_batch_summary: settings.lastBatchSummary,
    android_sms_granted: settings.androidSmsGranted,
    notifications_granted: settings.notificationsGranted,
    call_granted: settings.callGranted,
    location_granted: settings.locationGranted,
  };
}

async function triggerTinesSmsBatch(params: {
  userId: string;
  syncBatchId: string;
  items: Array<{
    message_id: string;
    message_hash: string;
    sender: string;
    body: string;
    received_at: string;
    idempotency_key: string;
  }>;
}) {
  const url = process.env.SMS_TINES_WEBHOOK_URL?.trim();
  if (!url || params.items.length === 0) {
    return;
  }

  const secret = process.env.SMS_TINES_WEBHOOK_SECRET?.trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      event: 'sms.batch.received',
      user_id: params.userId,
      sync_batch_id: params.syncBatchId,
      channel: 'sms',
      items: params.items,
    }),
  }).catch((error) => {
    console.error('[SMS import] Failed to trigger Tines webhook:', error);
  });
}

export class SmsImportService {
  static async getSettings(userId: string) {
    const settings = await SmsImportRepository.getOrCreateSettings(userId);
    return serializeSettings(settings);
  }

  static async updateSettings(userId: string, input: SmsSettingsUpdate) {
    const settings = await SmsImportRepository.updateSettings(userId, {
      ...(input.enabled !== undefined && { enabled: input.enabled }),
      ...(input.notify_on_sync !== undefined && { notifyOnSync: input.notify_on_sync }),
      ...(input.android_sms_granted !== undefined && { androidSmsGranted: input.android_sms_granted }),
      ...(input.notifications_granted !== undefined && {
        notificationsGranted: input.notifications_granted,
      }),
      ...(input.call_granted !== undefined && { callGranted: input.call_granted }),
      ...(input.location_granted !== undefined && { locationGranted: input.location_granted }),
    });
    return serializeSettings(settings);
  }

  static async getSyncStatus(userId: string) {
    const settings = await SmsImportRepository.getOrCreateSettings(userId);
    return {
      last_sync_at: settings.lastSyncAt?.toISOString() ?? null,
      last_batch_id: settings.lastBatchId,
      last_batch_summary: settings.lastBatchSummary,
    };
  }

  private static async ingestMessages(
    userId: string,
    deviceId: string,
    messages: SmsMessageInput[],
  ) {
    const settings = await SmsImportRepository.getOrCreateSettings(userId);
    if (!settings.enabled) {
      return {
        success: false,
        error: 'SMS import is disabled',
        accepted: 0,
        duplicates: 0,
        pending: 0,
        sync_batch_id: null,
      };
    }

    const maxBatch = getMaxBatchSize();
    if (messages.length > maxBatch) {
      throw new Error(`Batch exceeds maximum of ${maxBatch} messages`);
    }

    const syncBatchId = randomUUID();
    let accepted = 0;
    let duplicates = 0;
    const tinesItems: Array<{
      message_id: string;
      message_hash: string;
      sender: string;
      body: string;
      received_at: string;
      idempotency_key: string;
    }> = [];

    for (const message of messages) {
      const receivedAt = new Date(message.received_at);
      const messageHash =
        message.message_hash ??
        computeSmsMessageHash({
          userId,
          sender: message.sender,
          body: message.body,
          receivedAt,
        });

      const existing = await SmsImportRepository.findByMessageHash(userId, messageHash);
      if (existing) {
        duplicates += 1;
        continue;
      }

      const row = await SmsImportRepository.createMessage({
        userId,
        deviceId,
        externalSmsId: message.external_sms_id ?? null,
        messageHash,
        sender: message.sender,
        body: message.body,
        receivedAt,
        status: 'PENDING',
        syncBatchId,
      });

      accepted += 1;
      tinesItems.push({
        message_id: row.id,
        message_hash: messageHash,
        sender: message.sender,
        body: message.body,
        received_at: receivedAt.toISOString(),
        idempotency_key: `sms:${userId}:${messageHash}`,
      });
    }

    const summary = {
      accepted,
      duplicates,
      pending: accepted,
      sync_batch_id: syncBatchId,
    };

    await SmsImportRepository.updateSettings(userId, {
      lastSyncAt: new Date(),
      lastSyncDeviceId: deviceId,
      lastBatchId: syncBatchId,
      lastBatchSummary: summary,
    });

    await triggerTinesSmsBatch({ userId, syncBatchId, items: tinesItems });

    return {
      success: true,
      ...summary,
    };
  }

  static async syncBatch(userId: string, input: SmsSyncRequest) {
    return this.ingestMessages(userId, input.device_id, input.messages);
  }

  static async manualImport(userId: string, input: SmsManualImportRequest) {
    const deviceId = input.device_id ?? 'manual';
    const receivedAt = input.received_at ?? new Date().toISOString();
    return this.ingestMessages(userId, deviceId, [
      {
        sender: input.sender ?? 'manual',
        body: input.body,
        received_at: receivedAt,
      },
    ]);
  }

  static async markMessageFromBotResult(params: {
    idempotencyKey: string;
    success: boolean;
    errorCode?: string;
    transactionId?: string;
    intent?: string;
  }) {
    const messageHash = params.idempotencyKey.replace(/^sms:[^:]+:/, '');
    const message = await SmsImportRepository.findMessageByIdempotencyKey(params.idempotencyKey);
    if (!message || message.messageHash !== messageHash) {
      return;
    }

    if (params.intent === 'SKIP' || params.errorCode === 'SKIP') {
      await SmsImportRepository.updateMessageStatus(message.id, 'SKIPPED', {
        skipReason: 'Non-transactional SMS',
      });
      return;
    }

    if (params.errorCode === 'DUPLICATE') {
      await SmsImportRepository.updateMessageStatus(message.id, 'DUPLICATE', {
        transactionId: params.transactionId ?? null,
      });
      return;
    }

    if (!params.success) {
      await SmsImportRepository.updateMessageStatus(message.id, 'FAILED', {
        skipReason: params.errorCode ?? 'parse_failed',
      });
      return;
    }

    if (params.transactionId) {
      await SmsImportRepository.updateMessageStatus(message.id, 'PARSED', {
        transactionId: params.transactionId,
      });
      return;
    }

    await SmsImportRepository.updateMessageStatus(message.id, 'SKIPPED', {
      skipReason: 'No transaction created',
    });
  }
}
