import { createHmac } from 'crypto';

export const MOBILE_OAUTH_REDIRECT_COOKIE = 'mobile_oauth_redirect';
export const MOBILE_OAUTH_KEY_COOKIE = 'mobile_oauth_key';

/** A 32-byte base64url key from the app, sent in the HTTPS start URL. */
export function isValidSealKey(value: string | null | undefined): value is string {
  return !!value && /^[A-Za-z0-9_-]{43}$/.test(value);
}

/**
 * The `paysasuchan://` callback can be claimed by any installed app, so the login token is
 * XORed with an HMAC-SHA256 keystream from the app's one-time key. Only the app that started
 * the sign-in knows the key. Mirrors the Flutter app's `TokenSeal`.
 */
export function sealToken(token: string, key: string): string {
  const keyBytes = Buffer.from(key, 'base64url');
  const data = Buffer.from(token, 'utf8');
  const out = Buffer.alloc(data.length);
  for (let block = 0; block * 32 < data.length; block++) {
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(block);
    const stream = createHmac('sha256', keyBytes).update(Buffer.concat([Buffer.from('ps-seal'), counter])).digest();
    for (let i = 0; i < 32 && block * 32 + i < data.length; i++) {
      out[block * 32 + i] = data[block * 32 + i] ^ stream[i];
    }
  }
  return out.toString('base64url');
}

export function isAllowedMobileAppRedirect(value: string): boolean {
  try {
    const parsed = new URL(value);
    // exp:// can point at any host (Expo Go), so it would hand the login token to an attacker's project.
    return (
      parsed.protocol === 'paysasuchan:' ||
      (parsed.protocol === 'exp:' && process.env.NODE_ENV !== 'production')
    );
  } catch {
    return false;
  }
}

export function buildMobileAppReturnUrl(
  appRedirect: string,
  params: Record<string, string | undefined>,
): string {
  const target = new URL(appRedirect);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      target.searchParams.set(key, value);
    }
  }
  return target.toString();
}
