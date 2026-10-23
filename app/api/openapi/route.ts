import { NextRequest, NextResponse } from 'next/server';
import { buildOpenApiSpec } from '@/lib/openapi/spec';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const spec = buildOpenApiSpec(origin);
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
}
