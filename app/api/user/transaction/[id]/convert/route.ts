import { NextRequest } from 'next/server';
import { TransactionConvertController } from '@/lib/api/controllers/transaction-convert.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/middleware/rateLimiter';

export async function POST(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const user = await authGuard(req, 'CUSTOMER');
    await checkRateLimit(req, `txn_convert:${user.id}`, RATE_LIMIT_PRESETS.transactionWrite);
    return await TransactionConvertController.convert(req, id, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
