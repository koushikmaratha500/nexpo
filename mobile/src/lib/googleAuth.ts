import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createSupabaseClient } from './supabase';
import { getApiUrl } from './env';

WebBrowser.maybeCompleteAuthSession();

const DEEP_LINK_PATH = 'auth/callback';
const OAUTH_WAIT_MS = 1500;

/** Deep link that returns control to the Expo / standalone app. */
export function getGoogleDeepLinkUri(): string {
  return Linking.createURL(DEEP_LINK_PATH);
}

function getMobileBridgeBaseUrl(): string {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return getGoogleDeepLinkUri();
  }
  return `${apiUrl}/auth/mobile-callback`;
}

/**
 * Supabase redirect URL. Uses HTTPS bridge + app deep link so the in-app browser
 * can return to the app even when exp:// is not allow-listed.
 */
export function getGoogleRedirectUri(): string {
  const bridgeBase = getMobileBridgeBaseUrl();
  if (!bridgeBase.includes('/auth/mobile-callback')) {
    return bridgeBase;
  }

  const deepLink = getGoogleDeepLinkUri();
  const params = new URLSearchParams({ app_redirect: deepLink });
  return `${bridgeBase}?${params.toString()}`;
}

/** Prefix used by openAuthSessionAsync — must match without query params. */
export function getGoogleOAuthReturnPrefix(): string {
  return getMobileBridgeBaseUrl();
}

export function parseAuthResultUrl(resultUrl: string): {
  code?: string;
  accessToken?: string;
  error?: string;
} {
  const url = new URL(resultUrl);
  const error =
    url.searchParams.get('error_description') || url.searchParams.get('error') || undefined;
  const code = url.searchParams.get('code') || undefined;

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get('access_token') || undefined;

  return { code, accessToken, error };
}

function isOAuthCallbackUrl(url: string): boolean {
  return url.includes('auth/callback') || url.includes('auth/mobile-callback');
}

function describeUnexpectedOAuthUrl(resultUrl: string): string | null {
  try {
    const parsed = new URL(resultUrl);
    if (parsed.pathname.endsWith('/auth/mobile-callback') || parsed.pathname.endsWith('/auth/callback')) {
      return null;
    }
    if (parsed.pathname === '/auth/login' || parsed.pathname.startsWith('/auth/login')) {
      return (
        'Google sign-in opened the web login page instead of returning to the app. ' +
        `Add this URL in Supabase → Auth → Redirect URLs: ${getMobileBridgeBaseUrl()}`
      );
    }
    return (
      'Unexpected sign-in redirect. ' +
      `Add this URL in Supabase → Auth → Redirect URLs: ${getMobileBridgeBaseUrl()}`
    );
  } catch {
    return 'Invalid sign-in redirect URL';
  }
}

export async function completeGoogleOAuthFromUrl(
  resultUrl: string,
): Promise<{ accessToken: string } | { error: string }> {
  const unexpected = describeUnexpectedOAuthUrl(resultUrl);
  if (unexpected) {
    return { error: unexpected };
  }

  const parsed = parseAuthResultUrl(resultUrl);
  if (parsed.error) {
    return { error: parsed.error };
  }

  const supabase = createSupabaseClient();

  if (parsed.code) {
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(parsed.code);
    await supabase.auth.signOut();
    if (exchangeError || !sessionData.session?.access_token) {
      const message = exchangeError?.message || 'Failed to complete Google sign-in';
      if (message.toLowerCase().includes('code verifier')) {
        return {
          error:
            'OAuth session expired. Retry Google sign-in. If it persists, confirm the mobile callback URL is in Supabase Auth redirect URLs.',
        };
      }
      return { error: message };
    }
    return { accessToken: sessionData.session.access_token };
  }

  if (parsed.accessToken) {
    await supabase.auth.signOut();
    return { accessToken: parsed.accessToken };
  }

  return { error: 'Google sign-in session not found' };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function signInWithGoogleOAuth(): Promise<{ accessToken: string } | { error: string }> {
  const supabase = createSupabaseClient();
  const redirectTo = getGoogleRedirectUri();
  const returnPrefix = getGoogleOAuthReturnPrefix();

  if (__DEV__) {
    console.info('[Google OAuth] Supabase redirect URL:', redirectTo);
    console.info('[Google OAuth] Add this in Supabase → Auth → Redirect URLs:', returnPrefix);
    console.info('[Google OAuth] Deep link fallback:', getGoogleDeepLinkUri());
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error || !data?.url) {
    return { error: error?.message || 'Could not start Google sign-in' };
  }

  let settled = false;
  let deepLinkResult: { accessToken: string } | { error: string } | null = null;

  const finish = async (
    result: { accessToken: string } | { error: string },
  ): Promise<{ accessToken: string } | { error: string }> => {
    if (settled) {
      return result;
    }
    settled = true;
    subscription.remove();
    await WebBrowser.dismissBrowser();
    return result;
  };

  const subscription = Linking.addEventListener('url', (event) => {
    if (!isOAuthCallbackUrl(event.url)) {
      return;
    }
    void completeGoogleOAuthFromUrl(event.url).then((result) => {
      deepLinkResult = result;
    });
  });

  const browserResult = await WebBrowser.openAuthSessionAsync(data.url, returnPrefix, {
    preferEphemeralSession: false,
  });

  if (browserResult.type === 'success' && isOAuthCallbackUrl(browserResult.url)) {
    return finish(await completeGoogleOAuthFromUrl(browserResult.url));
  }

  if (deepLinkResult) {
    return finish(deepLinkResult);
  }

  if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
    await wait(OAUTH_WAIT_MS);
    if (deepLinkResult) {
      return finish(deepLinkResult);
    }
    subscription.remove();
    return { error: 'Google sign-in was cancelled' };
  }

  subscription.remove();
  return {
    error:
      'Google sign-in did not return to the app. ' +
      `Add ${returnPrefix} to Supabase Auth redirect URLs and ensure the API is running at ${getApiUrl()}.`,
  };
}
