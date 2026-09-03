import { type NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/responseHeaders';
import { buildOAuthCallbackRedirectFromRequest } from '@/lib/auth/oauthRedirect';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const oauthCallbackRedirect = buildOAuthCallbackRedirectFromRequest(request);
  if (oauthCallbackRedirect) {
    return applySecurityHeaders(NextResponse.redirect(oauthCallbackRedirect));
  }

  const response = await updateSession(request);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
