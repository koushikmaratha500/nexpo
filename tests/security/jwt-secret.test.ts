import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const authServicePath = path.resolve(__dirname, '../../lib/api/services/auth.service.ts');

describe('JWT secret hardening', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('auth.service requires JWT_SECRET with no fallback literal', () => {
    const source = readFileSync(authServicePath, 'utf8');
    expect(source).toContain('JWT_SECRET environment variable is required');
    expect(source).not.toMatch(/JWT_SECRET\s*\|\|\s*['"]/);
    expect(source).not.toContain('fallback');
  });

  it('throws when JWT_SECRET is missing', async () => {
    vi.stubEnv('JWT_SECRET', '');
    vi.resetModules();

    const { signJwt } = await import('@/lib/api/services/auth.service');
    await expect(signJwt({ id: '1', role: 'CUSTOMER' })).rejects.toThrow(/JWT_SECRET/);
  });
});
