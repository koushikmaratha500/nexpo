import { NextRequest } from 'next/server';
import { AccountLifecycleController } from '@/lib/api/controllers/account-lifecycle.controller';
import { authGuard } from '@/lib/api/middleware/authGuard';
import { handleApiError } from '@/lib/api/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await authGuard(req, 'CUSTOMER');
    return await AccountLifecycleController.getStatus(req, user.id);
  } catch (error) {
    return handleApiError(error);
  }
}
