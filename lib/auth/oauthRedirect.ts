import { type NextRequest } from 'next/server';

const DEFAULT_DEV_ORIGIN = 'http://localhost:3000';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, '');
}

function isLocalhostHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin.startsWith('http') ? origin : `https://${origin}`);
    return isLocalhostHost(hostname);
  } catch {
    return /localhost|127\.0\.0\.1/.test(origin);
  }
}

function readConfiguredAppOrigin(): string | null {
  const runtime = process.env.APP_URL?.trim();
  if (runtime && !isLocalhostOrigin(runtime)) {
    return normalizeOrigin(runtime);
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !(process.env.NODE_ENV === 'production' && isLocalhostOrigin(configured))) {
    return normalizeOrigin(configured);
  }

  return null;
}

/** Best-effort origin from env (server). Skips localhost env in production. */
export function getAppOriginFromEnv(): string {
  const configured = readConfiguredAppOrigin();
  if (configured) {
    return configured;
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return normalizeOrigin(productionUrl.startsWith('http') ? productionUrl : `https://${productionUrl}`);
  }

  if (process.env.VERCEL_URL) {
    return normalizeOrigin(`https://${process.env.VERCEL_URL}`);
  }

  return DEFAULT_DEV_ORIGIN;
}

/**
 * Resolve the public app origin for the current request.
 * Prefers proxy headers on Vercel so OAuth never uses a stale localhost env in production.
 */
export function resolveRequestOrigin(request: NextRequest | Request): string {
  const configured = readConfiguredAppOrigin();
  if (configured) {
    return configured;
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  if (forwardedHost && !isLocalhostHost(forwardedHost.split(':')[0])) {
    return normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
  }

  const host = request.headers.get('host')?.trim();
  if (host && !isLocalhostHost(host.split(':')[0])) {
    const proto =
      forwardedProto ||
      (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    return normalizeOrigin(`${proto}://${host}`);
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return normalizeOrigin(productionUrl.startsWith('http') ? productionUrl : `https://${productionUrl}`);
  }

  if (process.env.VERCEL_URL) {
    return normalizeOrigin(`https://${process.env.VERCEL_URL}`);
  }

  const requestOrigin = new URL(request.url).origin;
  if (!isLocalhostOrigin(requestOrigin)) {
    return requestOrigin;
  }

  const fallbackConfigured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fallbackConfigured) {
    return normalizeOrigin(fallbackConfigured);
  }

  return DEFAULT_DEV_ORIGIN;
}

/** Client-side: never force localhost env over the browser's production origin. */
export function getClientAppOrigin(): string {
  if (typeof window !== 'undefined') {
    const browserOrigin = window.location.origin;
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (configured && !isLocalhostOrigin(configured)) {
      return normalizeOrigin(configured);
    }

    if (!isLocalhostOrigin(browserOrigin)) {
      return browserOrigin;
    }

    if (configured) {
      return normalizeOrigin(configured);
    }

    return browserOrigin;
  }

  return getAppOriginFromEnv();
}

/** Cookie used to carry post-OAuth path; keep redirectTo free of query params for Supabase allow-list matching. */
export const OAUTH_NEXT_COOKIE = 'oauth_next';

export function normalizeOAuthNextPath(next: string | null | undefined): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/auth/callback/complete';
}

export function buildOAuthCallbackUrl(origin?: string): string {
  const base =
    origin ??
    (typeof window !== 'undefined' ? getClientAppOrigin() : getAppOriginFromEnv());

  return `${base}/auth/callback`;
}

export function resolveOAuthRedirectOrigin(request: Request): string {
  return resolveRequestOrigin(request);
}

export function buildAppRedirectUrl(request: Request, path: string): string {
  const origin = resolveOAuthRedirectOrigin(request);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

/** If Supabase sends ?code= to Site URL root, forward to our callback handler. */
export function buildOAuthCallbackRedirectFromRequest(request: NextRequest): URL | null {
  const code = request.nextUrl.searchParams.get('code');
  if (!code || request.nextUrl.pathname === '/auth/callback') {
    return null;
  }

  const target = request.nextUrl.clone();
  target.pathname = '/auth/callback';
  return target;
}
