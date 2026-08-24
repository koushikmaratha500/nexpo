import { NextRequest } from 'next/server';
import { SupportController } from '@/lib/api/controllers/support.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, getRequestIp, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    await checkRateLimit(req, `support_${getRequestIp(req)}`, RATE_LIMIT_PRESETS.support);
    return await SupportController.create(req);
  } catch (error) {
    return handleApiError(error);
  }
}
