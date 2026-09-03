import { NextRequest } from 'next/server';
import { TransactionShareController } from '@/lib/api/controllers/transaction-share.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, getRequestIp, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function GET(req: NextRequest, segmentData: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await segmentData.params;
    await checkRateLimit(req, `share_public:${getRequestIp(req)}`, RATE_LIMIT_PRESETS.sharePublic);
    return await TransactionShareController.getPublic(req, token);
  } catch (error) {
    return handleApiError(error);
  }
}
