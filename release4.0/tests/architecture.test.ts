import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getErrorMessage, getZodMessage } from '@/lib/api/controllers/base.controller';
import { z } from 'zod';

const repoRoot = path.resolve(__dirname, '../..');

function rg(pattern: string, glob: string): string {
  try {
    return execSync(`rg -l "${pattern}" --glob "${glob}"`, {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

describe('P2 architecture compliance', () => {
  it('has no prisma imports in app/api route handlers', () => {
    expect(rg("from '@/lib/prisma'", 'app/api/**/*.ts')).toBe('');
  });

  it('has no prisma usage in lib/api/services', () => {
    expect(rg('prisma\\.', 'lib/api/services/**/*.ts')).toBe('');
    expect(rg("from '@/lib/prisma'", 'lib/api/services/**/*.ts')).toBe('');
  });

  it('removed DI container and validation middleware files', () => {
    for (const file of [
      'lib/api/shared/di/index.ts',
      'lib/api/middleware/validationMiddleware.ts',
      'app/api/user/category/route.ts',
    ]) {
      expect(() => {
        execSync(`test ! -e "${file}"`, { cwd: repoRoot, shell: '/bin/bash' });
      }).not.toThrow();
    }
  });

  it('BaseController helpers format zod errors', () => {
    try {
      z.object({ email: z.string().email('Invalid email') }).parse({ email: 'bad' });
    } catch (error) {
      expect(getZodMessage(error)).toBe('Invalid email');
      expect(getErrorMessage(error)).toContain('Invalid');
    }
  });

  it('meta-resolution service module exists', () => {
    const file = readFileSync(
      path.resolve(__dirname, '../../lib/api/services/meta-resolution.service.ts'),
      'utf8',
    );
    expect(file).toContain('resolveForTransaction');
    expect(file).toContain('resolveForExpense');
    expect(file).toContain('resolveForDeposit');
  });
});
