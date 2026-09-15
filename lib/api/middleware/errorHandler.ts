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

export function handleApiError(error: any) {
  console.error('[API Error]', error);

  if (error.name === 'ZodError') {
    const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (error instanceof HttpError) {
    return NextResponse.json(httpErrorBody(error), { status: error.status });
  }

  return NextResponse.json(
    { error: error.message || 'Internal Server Error' },
    { status: error.status || 500 }
  );
}
