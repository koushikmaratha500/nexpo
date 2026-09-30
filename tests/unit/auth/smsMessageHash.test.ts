import { describe, expect, it } from 'vitest';
import {
  computeSmsMessageHash,
  computeTransactionImportFingerprint,
} from '@/lib/auth/smsMessageHash';

describe('computeSmsMessageHash', () => {
  it('produces stable sha256 for same inputs', () => {
    const params = {
      userId: 'user-1',
      sender: 'HDFC-BK',
      body: 'Rs 500 debited',
      receivedAt: '2026-09-18T10:00:00.000Z',
    };

    const first = computeSmsMessageHash(params);
    const second = computeSmsMessageHash(params);

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when body changes', () => {
    const base = {
      userId: 'user-1',
      sender: 'HDFC-BK',
      receivedAt: new Date('2026-09-18T10:00:00.000Z'),
    };

    const a = computeSmsMessageHash({ ...base, body: 'Rs 500 debited' });
    const b = computeSmsMessageHash({ ...base, body: 'Rs 600 debited' });

    expect(a).not.toBe(b);
  });
});

describe('computeTransactionImportFingerprint', () => {
  it('normalizes title and day for duplicate detection', () => {
    const params = {
      userId: 'user-1',
      type: 'DEBIT' as const,
      amount: 500,
      transactionDate: new Date('2026-09-18T15:30:00.000Z'),
      title: '  Swiggy  ',
    };

    const first = computeTransactionImportFingerprint(params);
    const second = computeTransactionImportFingerprint({
      ...params,
      title: 'swiggy',
      transactionDate: new Date('2026-09-18T08:00:00.000Z'),
    });

    expect(first).toBe(second);
  });
});
