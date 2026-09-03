import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  buildAppRedirectUrl,
  normalizeOAuthNextPath,
  OAUTH_NEXT_COOKIE,
} from '@/lib/auth/oauthRedirect';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieStore = await cookies();
  const nextFromCookie = cookieStore.get(OAUTH_NEXT_COOKIE)?.value;
  const next = normalizeOAuthNextPath(searchParams.get('next') ?? nextFromCookie);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!code || !supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(buildAppRedirectUrl(request, '/auth/login?error=google_auth_failed'));
  }

  cookieStore.set(OAUTH_NEXT_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(buildAppRedirectUrl(request, '/auth/login?error=google_auth_failed'));
  }

  return NextResponse.redirect(buildAppRedirectUrl(request, next));
}
