import { NextRequest } from 'next/server';
import { AccountLifecycleDispatchController } from '@/lib/api/controllers/account-lifecycle-dispatch.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { assertAccountLifecycleDispatchAuthorized } from '@/lib/api/utils/accountLifecycleDispatchAuth';

export async function POST(req: NextRequest) {
  try {
    assertAccountLifecycleDispatchAuthorized(req);
    return await AccountLifecycleDispatchController.purge(req);
  } catch (error) {
    return handleApiError(error);
  }
}
