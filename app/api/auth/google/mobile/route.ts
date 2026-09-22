import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  buildMobileOAuthCallbackUrl,
  resolveRequestOrigin,
} from '@/lib/auth/oauthRedirect';
import {
  isAllowedMobileAppRedirect,
  MOBILE_OAUTH_REDIRECT_COOKIE,
} from '@/lib/auth/mobileOAuth';

/**
 * Starts Google OAuth for the Expo mobile app.
 * PKCE + session exchange happen server-side; the app receives a Nexpo JWT via deep link.
 */
export async function GET(request: NextRequest) {
  const origin = resolveRequestOrigin(request);
  const appRedirect = request.nextUrl.searchParams.get('app_redirect')?.trim();

  if (!appRedirect || !isAllowedMobileAppRedirect(appRedirect)) {
    return NextResponse.json({ error: 'Invalid or missing app_redirect' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(`${origin}/auth/login?error=google_not_configured`);
  }

  const redirectTo = buildMobileOAuthCallbackUrl(origin);
  const cookieStore = await cookies();

  cookieStore.set(MOBILE_OAUTH_REDIRECT_COOKIE, appRedirect, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Route handler cookie writes can fail in some server contexts.
        }
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error || !data.url) {
    console.error('[Google OAuth mobile] Failed to start OAuth flow:', error?.message || 'missing provider URL');
    return NextResponse.redirect(`${origin}/auth/login?error=google_auth_failed`);
  }

  return NextResponse.redirect(data.url);
}
