import { NextRequest } from 'next/server';
import { MonthlyDigestDispatchController } from '@/lib/api/controllers/monthly-digest-dispatch.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { assertMonthlyDigestDispatchAuthorized } from '@/lib/api/utils/monthlyDigestDispatchAuth';

export async function POST(req: NextRequest) {
  try {
    assertMonthlyDigestDispatchAuthorized(req);
    return await MonthlyDigestDispatchController.dispatch(req);
  } catch (error) {
    return handleApiError(error);
  }
}
