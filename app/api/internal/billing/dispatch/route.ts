import { NextRequest } from 'next/server';
import { BillingDispatchController } from '@/lib/api/controllers/billing-dispatch.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { assertBillingDispatchAuthorized } from '@/lib/api/utils/billingDispatchAuth';

export async function POST(req: NextRequest) {
  try {
    assertBillingDispatchAuthorized(req);
    return await BillingDispatchController.dispatch(req);
  } catch (error) {
    return handleApiError(error);
  }
}
