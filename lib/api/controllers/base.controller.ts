import { NextRequest, NextResponse } from 'next/server';
import { HttpError } from '@/lib/api/middleware/errorHandler';

export type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };

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

  protected static async safeExecute<T>(
    handler: () => Promise<T>,
    errorMapper?: (error: unknown) => { message: string; status: number }
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return this.success(data);
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        return this.error(error.message, error.status);
      }
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        const err = error as { errors?: { message?: string }[]; issues?: { message?: string }[] };
        const message = err.errors?.[0]?.message || err.issues?.[0]?.message || 'Validation error';
        return this.badRequest(message);
      }
      if (errorMapper) {
        const mapped = errorMapper(error);
        return this.error(mapped.message, mapped.status);
      }
      const err = error as { message?: string };
      return this.error(err.message || 'Internal Server Error', 500);
    }
  }
}

export function withRequest(req: NextRequest): { req: NextRequest } {
  return { req };
}
