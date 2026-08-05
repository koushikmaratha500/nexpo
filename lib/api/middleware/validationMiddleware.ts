import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';
import { HttpError } from '@/lib/api/middleware/errorHandler';

export async function validateBody<T>(req: NextRequest, schema: ZodSchema): Promise<T> {
  try {
    const body = await req.clone().json();
    return schema.parse(body) as T;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const err = error as { errors?: { message?: string }[]; issues?: { message?: string }[]; message?: string };
      const message = err.errors?.[0]?.message || err.issues?.[0]?.message || err.message || 'Validation error';
      throw new HttpError(400, message);
    }
    throw error;
  }
}

export async function validateQuery<T>(req: NextRequest, schema: ZodSchema): Promise<T> {
  try {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });
    return schema.parse(query) as T;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const err = error as { errors?: { message?: string }[]; issues?: { message?: string }[]; message?: string };
      const message = err.errors?.[0]?.message || err.issues?.[0]?.message || err.message || 'Validation error';
      throw new HttpError(400, message);
    }
    throw error;
  }
}

export async function validateParams<T>(
  req: NextRequest,
  schema: ZodSchema,
  params: Record<string, string>
): Promise<T> {
  try {
    return schema.parse(params) as T;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const err = error as { errors?: { message?: string }[]; issues?: { message?: string }[]; message?: string };
      const message = err.errors?.[0]?.message || err.issues?.[0]?.message || err.message || 'Validation error';
      throw new HttpError(400, message);
    }
    throw error;
  }
}
