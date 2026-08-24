import { NextRequest, NextResponse } from 'next/server';
import { GET as getAdministrators, POST as postAdministrator } from '../administrators/route';

function withDeprecation(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Deprecation', 'true');
  headers.set('Link', '</api/admin/administrators>; rel="successor-version"');
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(req: NextRequest) {
  return withDeprecation(await getAdministrators(req));
}

export async function POST(req: NextRequest) {
  return withDeprecation(await postAdministrator(req));
}
