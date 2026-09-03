import { NextRequest, NextResponse } from 'next/server';
import { HttpError } from '@/lib/api/middleware/errorHandler';

export type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };

interface ErrorWithMessage {
  message?: string;
  name?: string;
  errors?: { message?: string }[];
  issues?: { message?: string }[];
}

export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof HttpError) return error.message;
  if (error instanceof Error) return error.message || fallback;
  const e = error as ErrorWithMessage;
  return e.message || fallback;
}

export function getZodMessage(error: unknown): string | null {
  const e = error as ErrorWithMessage;
  if (e.name !== 'ZodError') return null;
  return e.errors?.[0]?.message || e.issues?.[0]?.message || e.message || 'Validation error';
}

function resolveErrorStatus(error: unknown, fallback = 500): number {
  if (error instanceof HttpError) return error.status;
  if (getZodMessage(error)) return 400;
  const msg = getErrorMessage(error).toLowerCase();
  if (msg.includes('not found')) return 404;
  if (msg.includes('unauthorized') || msg.includes('forbidden')) return 403;
  return fallback;
}

export class BaseController {
  protected static success<T>(data: T, status = 200, message?: string): NextResponse {
    const body: ApiResponse<T> = message
      ? { success: true, data, message }
      : { success: true, data };
    return NextResponse.json(body, { status });
  }

  protected static error(message: string, status = 500): NextResponse {
    return NextResponse.json({ success: false, error: message } as ApiResponse, { status });
  }

  protected static badRequest(message: string): NextResponse {
    return this.error(message, 400);
  }

  protected static notFound(message = 'Resource not found'): NextResponse {
    return this.error(message, 404);
  }

  protected static forbidden(message = 'Insufficient permissions'): NextResponse {
    return this.error(message, 403);
  }

  protected static unauthorized(message = 'Unauthorized'): NextResponse {
    return this.error(message, 401);
  }

  /** Preserves legacy `{ error }` JSON responses used by existing API clients. */
  protected static async safeExecuteJson<T>(
    handler: () => Promise<T>,
    options?: { status?: number; errorStatus?: number; fallbackMessage?: string },
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return NextResponse.json(data, { status: options?.status ?? 200 });
    } catch (error: unknown) {
      const zodMsg = getZodMessage(error);
      if (zodMsg) return NextResponse.json({ error: zodMsg }, { status: 400 });
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      const message = getErrorMessage(error, options?.fallbackMessage);
      const status = options?.errorStatus ?? resolveErrorStatus(error, 500);
      return NextResponse.json({ error: message }, { status });
    }
  }

  protected static async safeExecute<T>(
    handler: () => Promise<T>,
    errorMapper?: (error: unknown) => { message: string; status: number },
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return this.success(data);
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        return this.error(error.message, error.status);
      }
      if (getZodMessage(error)) {
        return this.badRequest(getZodMessage(error)!);
      }
      if (errorMapper) {
        const mapped = errorMapper(error);
        return this.error(mapped.message, mapped.status);
      }
      return this.error(getErrorMessage(error), 500);
    }
  }

  protected static requestMeta(req: NextRequest) {
    return {
      ip: req.headers.get('x-forwarded-for') || '',
      ua: req.headers.get('user-agent') || '',
    };
  }
}

export function withRequest(req: NextRequest): { req: NextRequest } {
  return { req };
}
