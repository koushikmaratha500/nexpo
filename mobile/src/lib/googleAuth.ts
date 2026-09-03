import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { createSupabaseClient } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_PATH = 'auth/callback';

export function getGoogleRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'paysasuchan',
    path: REDIRECT_PATH,
  });
}

function parseAuthResultUrl(resultUrl: string): { code?: string; accessToken?: string; error?: string } {
  const url = new URL(resultUrl);
  const error = url.searchParams.get('error_description') || url.searchParams.get('error') || undefined;
  const code = url.searchParams.get('code') || undefined;

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get('access_token') || undefined;

  return { code, accessToken, error };
}

export async function signInWithGoogleOAuth(): Promise<{ accessToken: string } | { error: string }> {
  const supabase = createSupabaseClient();
  const redirectTo = getGoogleRedirectUri();

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

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { error: 'Google sign-in was cancelled' };
  }
  if (result.type !== 'success') {
    return { error: 'Google sign-in failed' };
  }

  const parsed = parseAuthResultUrl(result.url);
  if (parsed.error) {
    return { error: parsed.error };
  }

  if (parsed.code) {
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);
    await supabase.auth.signOut();
    if (exchangeError || !sessionData.session?.access_token) {
      return { error: exchangeError?.message || 'Failed to complete Google sign-in' };
    }
    return { accessToken: sessionData.session.access_token };
  }

  if (parsed.accessToken) {
    await supabase.auth.signOut();
    return { accessToken: parsed.accessToken };
  }

  return { error: 'Google sign-in session not found' };
}
