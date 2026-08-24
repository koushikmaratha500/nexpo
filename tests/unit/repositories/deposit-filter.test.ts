import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('transaction repository category filter', () => {
  it('filters CREDIT list by budgetDepositType relation name, not budgetDepositTypeId', () => {
    const file = readFileSync(
      path.resolve(__dirname, '../../../lib/api/repositories/transaction.repository.ts'),
      'utf8',
    );
    expect(file).toContain('where.budgetDepositType = {');
    expect(file).not.toContain('where.budgetDepositTypeId = {');
  });
});
