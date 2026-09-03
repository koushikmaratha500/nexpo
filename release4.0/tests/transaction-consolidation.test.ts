import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { MAX_PAGE_SIZE, parsePaginationParams } from '@/lib/api/dtos/pagination.dto';

const repoRoot = path.resolve(__dirname, '../..');

function rg(pattern: string, glob?: string): string {
  try {
    const globArg = glob ? ` --glob "${glob}"` : '';
    return execSync(`rg -l "${pattern}"${globArg}`, {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

describe('P3 transaction consolidation', () => {
  it('documents unified API contract', () => {
    const doc = readFileSync(path.resolve(__dirname, '../api-contract.md'), 'utf8');
    expect(doc).toContain('GET /api/user/transactions');
    expect(doc).toContain('{ items: T[], total: number }');
    expect(doc).toContain('/api/user/expense');
  });

  it('removed parallel expense/deposit route trees', () => {
    for (const file of [
      'app/api/user/expense/route.ts',
      'app/api/user/deposit/route.ts',
      'lib/api/services/expense.service.ts',
      'lib/api/services/deposit.service.ts',
      'lib/api/repositories/expense.repository.ts',
      'lib/api/repositories/deposit.repository.ts',
    ]) {
      expect(() => {
        execSync(`test ! -e "${file}"`, { cwd: repoRoot, shell: '/bin/bash' });
      }).not.toThrow();
    }
  });

  it('has no ExpenseRepository or DepositRepository imports in lib or app', () => {
    expect(rg('ExpenseRepository', 'lib/**/*.ts')).toBe('');
    expect(rg('DepositRepository', 'lib/**/*.ts')).toBe('');
    expect(rg('ExpenseRepository', 'app/**/*.ts')).toBe('');
    expect(rg('DepositRepository', 'app/**/*.ts')).toBe('');
  });

  it('has no client references to removed user expense/deposit API paths', () => {
    const patterns = ['/api/user/expense', '/api/user/deposit'];
    for (const pattern of patterns) {
      expect(rg(pattern, '*.{ts,tsx}'), `unexpected reference: ${pattern}`).toBe('');
    }
  });

  it('enforces pagination max pageSize', () => {
    const parsed = parsePaginationParams(new URLSearchParams('pageSize=500'));
    expect(parsed.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('transaction store uses paginated fetch instead of pageSize=1000', () => {
    const store = readFileSync(path.resolve(repoRoot, 'store/transactionStore.ts'), 'utf8');
    expect(store).not.toContain("params.set('pageSize', '1000')");
    expect(store).toContain('FETCH_PAGE_SIZE');
    expect(store).not.toContain('response.data.items || response.data');
  });

  it('admin user expenses route delegates through AdminController only', () => {
    const route = readFileSync(
      path.resolve(repoRoot, 'app/api/admin/user/[id]/expenses/route.ts'),
      'utf8',
    );
    expect(route).toContain('AdminController.getUserExpenses');
  });
});
