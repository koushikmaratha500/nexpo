import { HttpError } from '../middleware/errorHandler';

export function assertReminderDispatchAuthorized(req: Request) {
  const secret = process.env.REMINDER_DISPATCH_SECRET?.trim();
  if (!secret) {
    throw new HttpError(503, 'Reminder dispatch is not configured');
  }

  const headerSecret =
    req.headers.get('x-reminder-dispatch-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!headerSecret || headerSecret !== secret) {
    throw new HttpError(401, 'Unauthorized');
  }
}
