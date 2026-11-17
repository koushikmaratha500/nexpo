export const MOBILE_OAUTH_REDIRECT_COOKIE = 'mobile_oauth_redirect';

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
