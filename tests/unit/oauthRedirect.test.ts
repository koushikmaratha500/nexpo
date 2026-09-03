import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildAppRedirectUrl,
  buildOAuthCallbackRedirectFromRequest,
  buildOAuthCallbackUrl,
  getClientAppOrigin,
  isLocalhostOrigin,
  normalizeOAuthNextPath,
  resolveRequestOrigin,
} from '@/lib/auth/oauthRedirect';

describe('oauthRedirect', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('detects localhost origins', () => {
    expect(isLocalhostOrigin('http://localhost:3000')).toBe(true);
    expect(isLocalhostOrigin('https://app.example.com')).toBe(false);
  });

  it('builds a query-free callback URL for Supabase allow-list matching', () => {
    expect(buildOAuthCallbackUrl('https://app.example.com')).toBe(
      'https://app.example.com/auth/callback',
    );
  });

  it('normalizes oauth next paths', () => {
    expect(normalizeOAuthNextPath('/customer')).toBe('/customer');
    expect(normalizeOAuthNextPath('https://evil.com')).toBe('/auth/callback/complete');
  });

  it('prefers forwarded host over localhost env on server', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    vi.stubEnv('NODE_ENV', 'production');

    const request = new NextRequest('http://localhost:3000/api/auth/google', {
      headers: {
        'x-forwarded-host': 'paysasuchan.com',
        'x-forwarded-proto': 'https',
      },
    });

    expect(resolveRequestOrigin(request)).toBe('https://paysasuchan.com');
    expect(buildOAuthCallbackUrl('https://paysasuchan.com')).toBe(
      'https://paysasuchan.com/auth/callback',
    );
  });

  it('prefers runtime APP_URL over localhost public env', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    vi.stubEnv('APP_URL', 'https://paysasuchan.com');

    const request = new Request('http://localhost:3000/api/auth/google');
    expect(resolveRequestOrigin(request)).toBe('https://paysasuchan.com');
  });

  it('rewrites root ?code= hits to /auth/callback', () => {
    const request = new NextRequest('https://paysasuchan.com/?code=abc123&other=1');
    const redirect = buildOAuthCallbackRedirectFromRequest(request);
    expect(redirect?.pathname).toBe('/auth/callback');
    expect(redirect?.searchParams.get('code')).toBe('abc123');
  });

  it('prefers configured app url on callback redirect', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://paysasuchan.com');
    const request = new Request('http://localhost:3000/auth/callback?code=abc');
    expect(buildAppRedirectUrl(request, '/auth/callback/complete')).toBe(
      'https://paysasuchan.com/auth/callback/complete',
    );
  });
});

describe('getClientAppOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('ignores localhost env when browser is on production origin', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    vi.stubGlobal('window', {
      location: { origin: 'https://paysasuchan.com' },
    } as Window & typeof globalThis);

    expect(getClientAppOrigin()).toBe('https://paysasuchan.com');
  });
});
