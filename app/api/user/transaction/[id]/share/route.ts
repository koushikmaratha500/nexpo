import { NextRequest } from 'next/server';
import { TransactionShareController } from '@/lib/api/controllers/transaction-share.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `share_create:${user.id}`, RATE_LIMIT_PRESETS.shareCreate);
    return await TransactionShareController.create(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
