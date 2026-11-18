import { describe, expect, it } from 'vitest';
import { handleApiError, HttpError } from '@/lib/api/middleware/errorHandler';
import { getErrorMessage } from '@/lib/api/controllers/base.controller';

class PrismaClientKnownRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
  }
}

describe('error responses', () => {
  it('keeps HttpError status and message', async () => {
    const res = handleApiError(new HttpError(401, 'Invalid credentials'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Invalid credentials' });
  });

  it('never sends Prisma error text to the client', async () => {
    const leak = new PrismaClientKnownRequestError('Invalid `prisma.user.update()` invocation: column "passwordHash"');
    const res = handleApiError(leak);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal Server Error' });
    expect(getErrorMessage(leak, 'Login failed')).toBe('Login failed');
  });
});
