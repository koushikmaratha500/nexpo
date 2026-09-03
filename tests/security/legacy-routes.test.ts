import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

function rg(pattern: string): string {
  try {
    return execSync(`rg -l "${pattern}" --glob "*.{ts,tsx}"`, {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

const REMOVED_ROUTE_FILES = [
  'app/api/expenses/route.ts',
  'app/api/credits/route.ts',
  'app/api/user/expense/route.ts',
  'app/api/user/expenses/route.ts',
  'app/api/user/deposit/route.ts',
  'app/api/user/deposits/route.ts',
];

describe('legacy route removal', () => {
  it('removed legacy route files no longer exist', () => {
    for (const file of REMOVED_ROUTE_FILES) {
      expect(() => {
        execSync(`test ! -e "${file}"`, { cwd: repoRoot, shell: '/bin/bash' });
      }).not.toThrow();
    }
  });

  it('has no client references to removed API paths', () => {
    for (const pattern of ['/api/expenses', '/api/credits', '/api/user/expense', '/api/user/deposit']) {
      expect(rg(pattern), `unexpected reference: ${pattern}`).toBe('');
    }
  });
});
