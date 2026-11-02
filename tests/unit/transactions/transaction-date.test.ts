import { describe, expect, it } from 'vitest';
import { normalizeTransactionDateForStorage } from '@/lib/transactions/transaction-date';

describe('normalizeTransactionDateForStorage', () => {
  it('maps YYYY-MM-DD to start of that calendar day in app timezone', () => {
    const stored = normalizeTransactionDateForStorage('2026-10-31');
    expect(stored.toISOString()).toBe('2026-10-30T18:30:00.000Z');
  });
});
