import { NextRequest } from 'next/server';
import { CaptureController } from '@/lib/api/controllers/capture.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';
import { toProviderHttpError, unwrapProviderError } from '@/lib/ai/errors';

/** Mobile auto-capture: AI check of masked bank SMS / payment notifications (text is not stored). */
export async function POST(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `capture_assess:${user.id}`, RATE_LIMIT_PRESETS.captureAssess);
    return await CaptureController.assess(req, user.id);
  } catch (error) {
    return handleApiError(toProviderHttpError(error) ?? unwrapProviderError(error));
  }
}
