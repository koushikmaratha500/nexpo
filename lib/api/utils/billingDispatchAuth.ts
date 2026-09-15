import crypto from 'crypto';
import { HttpError } from '../middleware/errorHandler';

export function assertBillingDispatchAuthorized(req: Request) {
  const secret =
    process.env.BILLING_DISPATCH_SECRET?.trim() ||
    process.env.REMINDER_DISPATCH_SECRET?.trim();

  if (!secret) {
    throw new HttpError(503, 'Billing dispatch is not configured');
  }

  const headerSecret =
    req.headers.get('x-billing-dispatch-secret') ||
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
