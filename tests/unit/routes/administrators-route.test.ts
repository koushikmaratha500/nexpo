import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('administrators API route typo fix (P6.4)', () => {
  it('exposes canonical /api/admin/administrators route', () => {
    expect(() => {
      readFileSync(path.resolve(__dirname, '../../../app/api/admin/administrators/route.ts'), 'utf8');
    }).not.toThrow();
  });

  it('keeps deprecated adminstrators shim with Deprecation header', () => {
    const shim = readFileSync(
      path.resolve(__dirname, '../../../app/api/admin/adminstrators/route.ts'),
      'utf8',
    );
    expect(shim).toContain("Deprecation', 'true'");
    expect(shim).toContain('../administrators/route');
  });

  it('admin UI uses canonical administrators path', () => {
    const page = readFileSync(
      path.resolve(__dirname, '../../../app/admin/admins/page.tsx'),
      'utf8',
    );
    expect(page).toContain('/api/admin/administrators');
    expect(page).not.toContain('/api/admin/adminstrators');
  });
});
