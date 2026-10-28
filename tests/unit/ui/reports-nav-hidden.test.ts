import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../../..');

describe('Reports navigation visibility', () => {
  it('hides Reports from customer and admin layout nav links', () => {
    const customerLayout = fs.readFileSync(path.join(repoRoot, 'app/customer/layout.tsx'), 'utf8');
    const adminLayout = fs.readFileSync(path.join(repoRoot, 'app/admin/layout.tsx'), 'utf8');
    expect(customerLayout).not.toMatch(/\/customer\/reports/);
    expect(adminLayout).not.toMatch(/\/admin\/reports/);
  });

  it('keeps report route files present', () => {
    expect(fs.existsSync(path.join(repoRoot, 'app/customer/reports/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'app/admin/reports/page.tsx'))).toBe(true);
  });
});
