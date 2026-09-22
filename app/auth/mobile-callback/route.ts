import { NextResponse } from 'next/server';

/**
 * OAuth return URL for the Expo mobile app (in-app browser).
 * Supabase redirects here with ?code=; we bounce to the app deep link when provided.
 * The mobile client exchanges the code with PKCE locally.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const code = url.searchParams.get('code');
  const appRedirect = url.searchParams.get('app_redirect');

  if (error) {
    const message = errorDescription || error;
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

  if (code && appRedirect && isAllowedAppRedirect(appRedirect)) {
    const target = new URL(appRedirect);
    url.searchParams.forEach((value, key) => {
      if (key !== 'app_redirect') {
        target.searchParams.set(key, value);
      }
    });
    return NextResponse.redirect(target.toString());
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Signing in</title></head>
  <body style="font-family:system-ui,sans-serif;text-align:center;padding:2rem;">
    <p>Signing you in…</p>
    <p style="color:#666;font-size:0.9rem;">You can close this window and return to the PaysaSuchan app.</p>
  </body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

function isAllowedAppRedirect(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'paysasuchan:' || parsed.protocol === 'exp:';
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
