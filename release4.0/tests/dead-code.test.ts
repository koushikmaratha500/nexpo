import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

function rg(pattern: string): string {
  try {
    return execSync(`rg -l "${pattern}" --glob "*.ts" --glob "*.tsx"`, {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

describe('P1 dead-code removal', () => {
  it('has no references to removed stores, hooks, or legacy API paths in source', () => {
    const patterns = [
      'useExpenseStore',
      'useCreditStore',
      'useTransactions',
      '@/hooks/useTransactions',
      '@/hooks/useReports',
      '/api/expenses',
      '/api/credits',
      '/api/user/expense',
      '/api/user/deposit',
      '@/mock/data',
      'mock/credits_db',
    ];

    for (const pattern of patterns) {
      expect(rg(pattern), `unexpected reference: ${pattern}`).toBe('');
    }
  });

  it('removed files no longer exist', () => {
    const removed = [
      'store/expenseStore.ts',
      'store/creditStore.ts',
      'hooks/useTransactions.ts',
      'hooks/useReports.ts',
      'components/features/transactions/TransactionForm.tsx',
      'components/features/transactions/TransactionList.tsx',
      'components/forms/DocumentUploader.tsx',
      'mock/data.ts',
      'mock/credits_db.json',
      'app/api/expenses/route.ts',
      'app/api/credits/route.ts',
      'app/api/user/expense/route.ts',
      'app/api/user/deposit/route.ts',
    ];

    for (const file of removed) {
      expect(() => {
        execSync(`test ! -e "${file}"`, { cwd: repoRoot, shell: '/bin/bash' });
      }).not.toThrow();
    }
  });
});
