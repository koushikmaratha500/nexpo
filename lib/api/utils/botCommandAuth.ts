import crypto from 'crypto';
import { HttpError } from '../middleware/errorHandler';

export function assertBotCommandAuthorized(req: Request) {
  const secret = process.env.BOT_COMMAND_SECRET?.trim();
  if (!secret) {
    throw new HttpError(503, 'Bot command API is not configured');
  }

  const headerSecret =
    req.headers.get('x-bot-command-secret') ||
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
