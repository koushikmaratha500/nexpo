import { describe, expect, it } from 'vitest';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';

describe('TransactionRepository.serializeItems', () => {
  it('converts Decimal-like amount objects to numbers', () => {
    const items = TransactionRepository.serializeItems([
      { id: '1', amount: { valueOf: () => 42.5 } },
      { id: '2', amount: '10.25' },
      { id: '3', amount: 7 },
    ]);

    expect(items[0].amount).toBe(42.5);
    expect(items[1].amount).toBe('10.25');
    expect(items[2].amount).toBe(7);
  });

  it('serializeAmount handles nullish and numeric values', () => {
    expect(TransactionRepository.serializeAmount({ amount: 99 })).toBe(99);
    expect(TransactionRepository.serializeAmount({ amount: null })).toBeNull();
  });
});
