import { NextRequest } from 'next/server';
import { CaptureController } from '@/lib/api/controllers/capture.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

/** Saves a captured payment as a transaction, once per message (idempotent on its fingerprint). */
export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `txn_write:${user.id}`, RATE_LIMIT_PRESETS.transactionWrite);
    return await CaptureController.save(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
