import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computeSmsMessageHash } from '@/lib/auth/smsMessageHash';
import { SmsImportService } from '@/lib/api/services/sms-import.service';
import { SmsImportRepository } from '@/lib/api/repositories/sms-import.repository';

vi.mock('@/lib/api/repositories/sms-import.repository', () => ({
  SmsImportRepository: {
    getOrCreateSettings: vi.fn(),
    updateSettings: vi.fn(),
    findByMessageHash: vi.fn(),
    createMessage: vi.fn(),
    updateMessageStatus: vi.fn(),
    findMessageByIdempotencyKey: vi.fn(),
  },
}));

const mockedGetSettings = vi.mocked(SmsImportRepository.getOrCreateSettings);
const mockedUpdateSettings = vi.mocked(SmsImportRepository.updateSettings);
const mockedFindByHash = vi.mocked(SmsImportRepository.findByMessageHash);
const mockedCreateMessage = vi.mocked(SmsImportRepository.createMessage);
const mockedFindByIdempotency = vi.mocked(SmsImportRepository.findMessageByIdempotencyKey);
const mockedUpdateStatus = vi.mocked(SmsImportRepository.updateMessageStatus);

const baseSettings = {
  userId: 'user-1',
  enabled: true,
  notifyOnSync: true,
  lastSyncAt: null,
  lastSyncDeviceId: null,
  lastBatchId: null,
  lastBatchSummary: null,
  androidSmsGranted: false,
  notificationsGranted: false,
  callGranted: false,
  locationGranted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SmsImportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSettings.mockResolvedValue(baseSettings);
    mockedUpdateSettings.mockImplementation(async (userId, data) => ({
      ...baseSettings,
      userId,
      ...data,
      updatedAt: new Date(),
    }));
    mockedFindByHash.mockResolvedValue(null);
    mockedCreateMessage.mockImplementation(async (data) => ({
      id: 'msg-1',
      ...data,
      skipReason: null,
      botRequestId: null,
      transactionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('skips duplicate message hashes without creating rows', async () => {
    const receivedAt = '2026-09-18T10:00:00.000Z';
    const messageHash = computeSmsMessageHash({
      userId: 'user-1',
      sender: 'HDFC-BK',
      body: 'Rs 500 debited',
      receivedAt,
    });

    mockedFindByHash.mockResolvedValue({
      id: 'existing',
      userId: 'user-1',
      deviceId: 'dev-1',
      externalSmsId: null,
      messageHash,
      sender: 'HDFC-BK',
      body: 'Rs 500 debited',
      receivedAt: new Date(receivedAt),
      status: 'PARSED',
      skipReason: null,
      botRequestId: null,
      transactionId: 'txn-1',
      syncBatchId: 'batch-old',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await SmsImportService.syncBatch('user-1', {
      device_id: 'dev-1',
      messages: [
        {
          sender: 'HDFC-BK',
          body: 'Rs 500 debited',
          received_at: receivedAt,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.accepted).toBe(0);
    expect(result.duplicates).toBe(1);
    expect(mockedCreateMessage).not.toHaveBeenCalled();
  });

  it('returns disabled error when import is turned off', async () => {
    mockedGetSettings.mockResolvedValue({ ...baseSettings, enabled: false });

    const result = await SmsImportService.syncBatch('user-1', {
      device_id: 'dev-1',
      messages: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('SMS import is disabled');
  });

  it('marks message PARSED when bot returns transaction id', async () => {
    const messageHash = 'abc123';
    mockedFindByIdempotency.mockResolvedValue({
      id: 'msg-1',
      userId: 'user-1',
      deviceId: 'dev-1',
      externalSmsId: null,
      messageHash,
      sender: 'HDFC-BK',
      body: 'Rs 500 debited',
      receivedAt: new Date(),
      status: 'PENDING',
      skipReason: null,
      botRequestId: null,
      transactionId: null,
      syncBatchId: 'batch-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await SmsImportService.markMessageFromBotResult({
      idempotencyKey: `sms:user-1:${messageHash}`,
      success: true,
      transactionId: 'txn-99',
    });

    expect(mockedUpdateStatus).toHaveBeenCalledWith('msg-1', 'PARSED', {
      transactionId: 'txn-99',
    });
  });

  it('marks message SKIPPED for SKIP intent', async () => {
    const messageHash = 'otp-hash';
    mockedFindByIdempotency.mockResolvedValue({
      id: 'msg-otp',
      userId: 'user-1',
      deviceId: 'dev-1',
      externalSmsId: null,
      messageHash,
      sender: 'BANK',
      body: 'OTP 123456',
      receivedAt: new Date(),
      status: 'PENDING',
      skipReason: null,
      botRequestId: null,
      transactionId: null,
      syncBatchId: 'batch-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await SmsImportService.markMessageFromBotResult({
      idempotencyKey: `sms:user-1:${messageHash}`,
      success: false,
      intent: 'SKIP',
    });

    expect(mockedUpdateStatus).toHaveBeenCalledWith('msg-otp', 'SKIPPED', {
      skipReason: 'Non-transactional SMS',
    });
  });
});
