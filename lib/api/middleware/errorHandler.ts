import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function httpErrorBody(error: HttpError): Record<string, unknown> {
  return { error: error.message, ...(error.extra ?? {}) };
}

/** Prisma errors carry model/field/query details; never send their text to clients. */
export function isInternalLibraryError(error: unknown): boolean {
  return error instanceof Error && error.name.startsWith('PrismaClient');
}

type LooseError = {
  name?: string;
  message?: string;
  status?: number;
  errors?: { message?: string }[];
  issues?: { message?: string }[];
};

export function handleApiError(caught: unknown) {
  console.error('[API Error]', caught);
  const error = (caught ?? {}) as LooseError;

  if (error.name === 'ZodError') {
    const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (caught instanceof HttpError) {
    return NextResponse.json(httpErrorBody(caught), { status: caught.status });
  }

  return NextResponse.json(
    { error: (!isInternalLibraryError(caught) && error.message) || 'Internal Server Error' },
    { status: error.status || 500 }
  );
}
