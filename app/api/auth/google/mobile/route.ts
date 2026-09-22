import { NextRequest, NextResponse } from 'next/server';

/** Back-compat alias — forwards to /api/auth/google?mobile=1 */
export async function GET(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = '/api/auth/google';
  target.searchParams.set('mobile', '1');
  return NextResponse.redirect(target);
}
