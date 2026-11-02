import { describe, expect, it } from 'vitest';
import { updateTransactionSchema } from '@/lib/api/dtos/transaction.dto';

describe('updateTransactionSchema', () => {
  it('accepts patch with title only and empty merchant omitted', () => {
    const result = updateTransactionSchema.parse({
      type: 'CREDIT',
      title: 'Salary',
      amount: 1000,
      transactionDate: '2026-10-15',
      merchant: '',
    });
    expect(result.title).toBe('Salary');
    expect(result.merchant).toBeUndefined();
  });

  it('allows amount-only patch when title and merchant are omitted', () => {
    const result = updateTransactionSchema.parse({
      type: 'CREDIT',
      title: '',
      merchant: '',
      amount: 50,
    });
    expect(result.amount).toBe(50);
    expect(result.title).toBeUndefined();
  });
});
