import { describe, expect, it } from 'vitest';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';

describe('TransactionRepository admin user ledger scope', () => {
  it('buildListWhere with adminUserId uses payer, creator, and split participation', () => {
    const where = TransactionRepository.buildListWhere({ adminUserId: 'user-abc' });
    expect(where).toEqual({
      AND: [
        { status: { not: 'D' } },
        {
          OR: [
            { userId: 'user-abc' },
            { createdByUserId: 'user-abc' },
            { splits: { some: { userId: 'user-abc' } } },
          ],
        },
      ],
    });
  });

  it('combines admin scope with search without clobbering OR', () => {
    const where = TransactionRepository.buildListWhere({
      adminUserId: 'user-abc',
      search: 'coffee',
    });
    expect(where.AND).toHaveLength(3);
    const searchClause = (where.AND as object[])[2] as { OR: unknown[] };
    expect(searchClause.OR).toHaveLength(5);
  });
});
