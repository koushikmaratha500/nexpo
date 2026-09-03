import { NextRequest } from 'next/server';

export function createJsonRequest(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function createFormRequest(
  url: string,
  formData: FormData,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers,
    body: formData,
  });
}

export async function readJsonResponse<T = unknown>(
  response: Response,
): Promise<{ status: number; body: T }> {
  const body = (await response.json()) as T;
  return { status: response.status, body };
}

export type RouteHandler = (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> },
) => Promise<Response>;

export async function invokeRoute(
  handler: RouteHandler,
  req: NextRequest,
  params?: Record<string, string>,
): Promise<Response> {
  if (params) {
    return handler(req, { params: Promise.resolve(params) });
  }
  return handler(req);
}
