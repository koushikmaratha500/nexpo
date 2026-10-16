import crypto from 'crypto';
import { HttpError } from '../middleware/errorHandler';

export function assertMonthlyDigestDispatchAuthorized(req: Request) {
  const secret =
    process.env.MONTHLY_DIGEST_DISPATCH_SECRET?.trim() ||
    process.env.REMINDER_DISPATCH_SECRET?.trim();

  if (!secret) {
    throw new HttpError(503, 'Monthly digest dispatch is not configured');
  }

  const headerSecret =
    req.headers.get('x-monthly-digest-dispatch-secret') ||
    req.headers.get('x-reminder-dispatch-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!headerSecret) {
    throw new HttpError(401, 'Unauthorized');
  }

  const expected = Buffer.from(secret);
  const provided = Buffer.from(headerSecret);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    throw new HttpError(401, 'Unauthorized');
  }
}
