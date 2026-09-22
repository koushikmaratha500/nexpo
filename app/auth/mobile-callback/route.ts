import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/api/services/auth.service';
import {
  buildMobileAppReturnUrl,
  isAllowedMobileAppRedirect,
  MOBILE_OAUTH_REDIRECT_COOKIE,
} from '@/lib/auth/mobileOAuth';

/**
 * OAuth return URL for the Expo mobile app (in-app browser).
 * Server exchanges the Supabase code, issues a Nexpo JWT, then deep-links back to the app.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const code = url.searchParams.get('code');
  const cookieStore = await cookies();
  const appRedirect = cookieStore.get(MOBILE_OAUTH_REDIRECT_COOKIE)?.value;

  const clearMobileCookie = () => {
    cookieStore.set(MOBILE_OAUTH_REDIRECT_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  };

  if (appRedirect && isAllowedMobileAppRedirect(appRedirect)) {
    if (oauthError) {
      clearMobileCookie();
      return NextResponse.redirect(
        buildMobileAppReturnUrl(appRedirect, {
          error: oauthError,
          error_description: errorDescription ?? oauthError,
        }),
      );
    }

    if (!code) {
      return mobilePendingHtml();
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

    if (!supabaseUrl || !supabaseKey) {
      clearMobileCookie();
      return NextResponse.redirect(
        buildMobileAppReturnUrl(appRedirect, { error: 'google_not_configured' }),
      );
    }

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

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    clearMobileCookie();

    if (exchangeError || !data.session?.access_token) {
      console.error('[Google OAuth mobile] Code exchange failed:', exchangeError?.message);
      return NextResponse.redirect(
        buildMobileAppReturnUrl(appRedirect, { error: 'google_auth_failed' }),
      );
    }

    try {
      const result = await AuthService.loginWithGoogle(data.session.access_token, { ip: '', ua: '' });
      return NextResponse.redirect(
        buildMobileAppReturnUrl(appRedirect, {
          token: result.token,
          success: '1',
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'google_auth_failed';
      return NextResponse.redirect(
        buildMobileAppReturnUrl(appRedirect, {
          error: 'google_auth_failed',
          error_description: message,
        }),
      );
    }
  }

  if (oauthError) {
    const message = errorDescription || oauthError;
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Sign-in failed</title></head>
  <body style="font-family:system-ui,sans-serif;text-align:center;padding:2rem;">
    <p>Google sign-in failed.</p>
    <p style="color:#666;font-size:0.9rem;">${escapeHtml(message)}</p>
    <p style="color:#666;font-size:0.9rem;">Close this window and return to the PaysaSuchan app.</p>
  </body>
</html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  return mobilePendingHtml();
}

function mobilePendingHtml(): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Signing in</title></head>
  <body style="font-family:system-ui,sans-serif;text-align:center;padding:2rem;">
    <p>Signing you in…</p>
    <p style="color:#666;font-size:0.9rem;">Return to the PaysaSuchan app.</p>
  </body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
