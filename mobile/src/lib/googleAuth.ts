import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { getApiUrl } from './env';

WebBrowser.maybeCompleteAuthSession();

const DEEP_LINK_PATH = 'auth/callback';
const OAUTH_WAIT_MS = 3000;

export type GoogleSignInResult = { token: string } | { error: string };

/** Deep link that returns control to the Expo / standalone app. */
export function getGoogleDeepLinkUri(): string {
  return Linking.createURL(DEEP_LINK_PATH);
}

export function getGoogleOAuthReturnPrefix(): string {
  const apiUrl = getApiUrl();
  return apiUrl ? `${apiUrl}/auth/mobile-callback` : getGoogleDeepLinkUri();
}

function isAppCallbackUrl(url: string): boolean {
  return url.includes('auth/callback');
}

function parseAppCallbackUrl(url: string): GoogleSignInResult | null {
  if (!isAppCallbackUrl(url)) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    if (token) {
      return { token };
    }

    const error =
      parsed.searchParams.get('error_description') ||
      parsed.searchParams.get('error') ||
      undefined;
    if (error) {
      return { error };
    }
  } catch {
    return null;
  }

  return null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Server-driven Google OAuth for mobile.
 * Opens the API starter in an in-app browser; the server exchanges the code and
 * deep-links back with a Nexpo JWT.
 */
export async function signInWithGoogleOAuth(): Promise<GoogleSignInResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return { error: 'API URL is not configured. Add EXPO_PUBLIC_API_URL to mobile/.env.' };
  }

  const appRedirect = getGoogleDeepLinkUri();
  const startUrl = `${apiUrl}/api/auth/google?mobile=1&app_redirect=${encodeURIComponent(appRedirect)}`;
  const returnPrefix = getGoogleOAuthReturnPrefix();

  if (__DEV__) {
    console.info('[Google OAuth] Start URL:', startUrl);
    console.info('[Google OAuth] Deep link:', appRedirect);
  }

  return await new Promise<GoogleSignInResult>((resolve) => {
    let settled = false;

    const finish = async (result: GoogleSignInResult) => {
      if (settled) {
        return;
      }
      settled = true;
      subscription.remove();
      await WebBrowser.dismissBrowser();
      resolve(result);
    };

    const handleUrl = (url: string) => {
      const parsed = parseAppCallbackUrl(url);
      if (parsed) {
        void finish(parsed);
      }
    };

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    void WebBrowser.openAuthSessionAsync(startUrl, returnPrefix).then(async (result) => {
      if (result.type === 'success') {
        handleUrl(result.url);
      }

      if (!settled) {
        await wait(OAUTH_WAIT_MS);
      }

      if (!settled) {
        void finish({
          error:
            'Google sign-in did not return to the app. Deploy the latest API update, then try again.',
        });
      }
    });
  });
}
